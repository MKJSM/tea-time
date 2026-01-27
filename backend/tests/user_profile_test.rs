use backend::auth::{AuthSession, AuthUser, RequiredAuthUser};
use backend::domain::models::{CreateAddressRequest, UpdateUserProfileRequest, UserProfileResponse};
use backend::handlers::addresses::{create_address, delete_address, list_addresses};
use backend::handlers::favorites::{add_favorite, list_favorites};
use backend::handlers::user::{get_user_profile, update_user_profile};
use backend::state::AppState;
use axum::extract::{Path, State};
use axum::Json;
use std::sync::Arc;
use backend::infrastructure::session_store::PostgresSessionStore;
use backend::state::RazorpayConfig;
use sqlx::PgPool;
use uuid::Uuid;

mod common;
use common::*;

struct TestFixture {
    pool: PgPool,
    user: TestUser,
    product: TestProduct,
}

impl TestFixture {
    async fn new() -> Self {
        let pool = create_test_pool().await;
        run_migrations(&pool).await;
        cleanup_test_data(&pool).await;

        let user = TestUser::default();
        user.insert(&pool).await.expect("Failed to insert test user");

        let product = TestProduct::default();
        product.insert(&pool).await.expect("Failed to insert test product");

        Self {
            pool,
            user,
            product,
        }
    }

    async fn cleanup(&self) {
        cleanup_test_data(&self.pool).await;
    }
}

#[tokio::test]
async fn test_user_profile_flow() {
    let fixture = TestFixture::new().await;
    
    // Setup AppState
    let session_store = PostgresSessionStore::new(fixture.pool.clone());
    let state = AppState {
        db: fixture.pool.clone(),
        session_store,
        razorpay: Arc::new(RazorpayConfig {
            key_id: "test".to_string(),
            key_secret: "test".to_string(),
            webhook_secret: "test".to_string(),
        }),
        s3_client: aws_sdk_s3::Client::new(&aws_config::load_defaults(aws_config::BehaviorVersion::latest()).await),
        s3_bucket: "test".to_string(),
        s3_public_url: None,
        max_upload_size: 1024,
    };

    let auth_user_inner = AuthUser {
        id: fixture.user.id,
        email: fixture.user.email.clone(),
        name: fixture.user.name.clone(),
    };
    
    // 1. Get Initial Profile
    let profile_res = get_user_profile(
        RequiredAuthUser(auth_user_inner.clone()), 
        State(state.clone())
    )
    .await
    .expect("Failed to get profile");
    
    assert_eq!(profile_res.0.email, fixture.user.email);
    assert_eq!(profile_res.0.active_orders_count, 0);
    assert_eq!(profile_res.0.wishlist_count, 0);
    assert!(profile_res.0.addresses.is_empty());

    // 2. Update Profile
    let update_payload = UpdateUserProfileRequest {
        name: Some("Updated Name".to_string()),
        phone: Some("+1234567890".to_string()),
        email: None,
        image_url: None,
    };

    let updated_res = update_user_profile(
        RequiredAuthUser(auth_user_inner.clone()),
        State(state.clone()), 
        Json(update_payload)
    ).await.expect("Failed to update profile");

    assert_eq!(updated_res.0.name, "Updated Name");
    assert_eq!(updated_res.0.phone, "+1234567890");

    // 3. Add Address (First one -> Default)
    let addr_payload = CreateAddressRequest {
        label: "Home".to_string(),
        recipient_name: "Test Recipient".to_string(),
        phone_number: "1234567890".to_string(),
        street_address: "123 St".to_string(),
        city: "City".to_string(),
        state: "State".to_string(),
        postal_code: "12345".to_string(),
        latitude: None,
        longitude: None,
        is_default: false, // Should become default automatically
    };

    let addr1 = create_address(
        AuthSession { user: Some(auth_user_inner.clone()) }, 
        State(state.clone()), 
        Json(addr_payload)
    ).await.expect("Failed to create address");
    
    assert!(addr1.0.is_default);

    // 4. Add Second Address (Explicit default)
    let addr_payload2 = CreateAddressRequest {
        label: "Work".to_string(),
        recipient_name: "Test Recipient".to_string(),
        phone_number: "1234567890".to_string(),
        street_address: "456 Ave".to_string(),
        city: "City".to_string(),
        state: "State".to_string(),
        postal_code: "67890".to_string(),
        latitude: None,
        longitude: None,
        is_default: true,
    };

    let addr2 = create_address(
        AuthSession { user: Some(auth_user_inner.clone()) }, 
        State(state.clone()), 
        Json(addr_payload2)
    ).await.expect("Failed to create address 2");
    
    assert!(addr2.0.is_default);

    // Verify first address is no longer default
    let addresses = list_addresses(
        AuthSession { user: Some(auth_user_inner.clone()) }, 
        State(state.clone())
    ).await.expect("Failed list addresses");
    let fetched_addr1 = addresses.0.iter().find(|a| a.id == addr1.0.id).unwrap();
    assert!(!fetched_addr1.is_default);

    // 5. Delete Default Address (Should reassign default)
    let _ = delete_address(
        AuthSession { user: Some(auth_user_inner.clone()) }, 
        State(state.clone()), 
        Path(addr2.0.id)
    ).await.expect("Failed to delete address");

    let addresses_after_delete = list_addresses(
        AuthSession { user: Some(auth_user_inner.clone()) }, 
        State(state.clone())
    ).await.expect("Failed list addresses");
    assert_eq!(addresses_after_delete.0.len(), 1);
    assert!(addresses_after_delete.0[0].is_default, "Remaining address should be made default");

    // 6. Favorites
    add_favorite(
        RequiredAuthUser(auth_user_inner.clone()),
        State(state.clone()), 
        Path(fixture.product.id)
    ).await.expect("Failed to add favorite");
    
    let favorites = list_favorites(
        RequiredAuthUser(auth_user_inner.clone()),
        State(state.clone())
    ).await.expect("Failed to list favorites");
    assert_eq!(favorites.0.len(), 1);

    // 7. Verify Profile Counts
    let final_profile = get_user_profile(
        RequiredAuthUser(auth_user_inner.clone()),
        State(state.clone())
    ).await.expect("Failed to get profile");
    assert_eq!(final_profile.0.wishlist_count, 1);
    assert_eq!(final_profile.0.addresses.len(), 1);

    fixture.cleanup().await;
}
