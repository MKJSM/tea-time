use axum::{
    body::Body,
    http::{Request, StatusCode},
    Router,
};
use backend::domain::models::{Address, CreateAddressRequest, UpdateAddressRequest};
use backend::handlers;
use backend::infrastructure::session_store::PostgresSessionStore;
use backend::state::AppState;
use sqlx::PgPool;
use tower::ServiceExt;

mod common;
use common::{cleanup_test_data, create_test_pool, run_migrations, TestUser};

async fn setup_app(pool: PgPool) -> Router {
    let session_store = PostgresSessionStore::new(pool.clone());
    session_store
        .migrate()
        .await
        .expect("Failed to migrate session store");

    let state = AppState::new_mock(pool, session_store).await;

    handlers::build_router(state)
}

async fn get_auth_cookie(pool: &PgPool, app: &Router) -> String {
    let user = TestUser::default();
    user.insert(pool).await.unwrap();

    let login_req = Request::builder()
        .method("POST")
        .uri("/api/auth/login")
        .header("content-type", "application/json")
        .body(Body::from(
            serde_json::to_string(&serde_json::json!({
                "email": user.email,
                "password": "test" // Default password for TestUser
            }))
            .unwrap(),
        ))
        .unwrap();

    let response = app.clone().oneshot(login_req).await.unwrap();
    let status = response.status();
    if status != StatusCode::OK {
        let body_bytes = axum::body::to_bytes(response.into_body(), usize::MAX)
            .await
            .unwrap();
        panic!(
            "Login failed with status {}: {:?}",
            status,
            String::from_utf8_lossy(&body_bytes)
        );
    }
    response
        .headers()
        .get("set-cookie")
        .expect("No set-cookie header in login response")
        .to_str()
        .unwrap()
        .to_string()
}

#[tokio::test]
async fn test_address_management() {
    let pool = create_test_pool().await;
    run_migrations(&pool).await;
    cleanup_test_data(&pool).await;

    let app = setup_app(pool.clone()).await;
    let cookie = get_auth_cookie(&pool, &app).await;

    // 1. Create Address
    let create_payload = CreateAddressRequest {
        label: "Home".to_string(),
        recipient_name: "Test User".to_string(),
        phone_number: "1234567890".to_string(),
        street_address: "123 Main St".to_string(),
        city: "Test City".to_string(),
        state: "Test State".to_string(),
        postal_code: "123456".to_string(),
        latitude: None,
        longitude: None,
        is_default: true,
    };

    let request = Request::builder()
        .method("POST")
        .uri("/api/user/addresses")
        .header("content-type", "application/json")
        .header("cookie", &cookie)
        .body(Body::from(serde_json::to_string(&create_payload).unwrap()))
        .unwrap();

    let response = app.clone().oneshot(request).await.unwrap();
    assert_eq!(response.status(), StatusCode::OK);

    let body_bytes = axum::body::to_bytes(response.into_body(), usize::MAX)
        .await
        .unwrap();
    let created_address: Address = serde_json::from_slice(&body_bytes).unwrap();
    assert_eq!(created_address.label, "Home");
    assert!(created_address.is_default);

    // 2. List Addresses
    let request = Request::builder()
        .method("GET")
        .uri("/api/user/addresses")
        .header("cookie", &cookie)
        .body(Body::empty())
        .unwrap();

    let response = app.clone().oneshot(request).await.unwrap();
    assert_eq!(response.status(), StatusCode::OK);

    let body_bytes = axum::body::to_bytes(response.into_body(), usize::MAX)
        .await
        .unwrap();
    let addresses: Vec<Address> = serde_json::from_slice(&body_bytes).unwrap();
    assert_eq!(addresses.len(), 1);

    // 3. Update Address
    let update_payload = UpdateAddressRequest {
        label: Some("Work".to_string()),
        recipient_name: None,
        phone_number: None,
        street_address: None,
        city: None,
        state: None,
        postal_code: None,
        latitude: None,
        longitude: None,
        is_default: None,
    };

    let request = Request::builder()
        .method("PUT")
        .uri(format!("/api/user/addresses/{}", created_address.id))
        .header("content-type", "application/json")
        .header("cookie", &cookie)
        .body(Body::from(serde_json::to_string(&update_payload).unwrap()))
        .unwrap();

    let response = app.clone().oneshot(request).await.unwrap();
    assert_eq!(response.status(), StatusCode::OK);

    let body_bytes = axum::body::to_bytes(response.into_body(), usize::MAX)
        .await
        .unwrap();
    let updated_address: Address = serde_json::from_slice(&body_bytes).unwrap();
    assert_eq!(updated_address.label, "Work");

    // 4. Delete Address
    let request = Request::builder()
        .method("DELETE")
        .uri(format!("/api/user/addresses/{}", created_address.id))
        .header("cookie", &cookie)
        .body(Body::empty())
        .unwrap();

    let response = app.clone().oneshot(request).await.unwrap();
    assert_eq!(response.status(), StatusCode::NO_CONTENT);

    // Verify empty
    let request = Request::builder()
        .method("GET")
        .uri("/api/user/addresses")
        .header("cookie", &cookie)
        .body(Body::empty())
        .unwrap();

    let response = app.clone().oneshot(request).await.unwrap();
    let body_bytes = axum::body::to_bytes(response.into_body(), usize::MAX)
        .await
        .unwrap();
    let addresses: Vec<Address> = serde_json::from_slice(&body_bytes).unwrap();
    assert!(addresses.is_empty());
}
