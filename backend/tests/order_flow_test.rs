use backend::auth::{AuthUser, RequiredAuthUser};
use backend::domain::order::{
    CreateOrderRequest, VerifyPaymentRequest,
};
use backend::handlers::orders::{create_order, verify_payment};
use backend::state::{AppState, RazorpayConfig};
use axum::extract::State;
use axum::Json;
use std::sync::Arc;
use backend::infrastructure::session_store::PostgresSessionStore;
use sqlx::PgPool;
use uuid::Uuid;

mod common;
use common::*;

struct TestFixture {
    pool: PgPool,
    user: TestUser,
    address: TestAddress,
    product: TestProduct,
    customization_group: TestCustomizationGroup,
    customization_option: TestCustomizationOption,
}

impl TestFixture {
    async fn new() -> Self {
        let pool = create_test_pool().await;
        run_migrations(&pool).await;
        cleanup_test_data(&pool).await;

        let user = TestUser::default();
        user.insert(&pool)
            .await
            .expect("Failed to insert test user");

        let address = TestAddress::new(user.id);
        address
            .insert(&pool)
            .await
            .expect("Failed to insert test address");

        let product = TestProduct::default();
        product
            .insert(&pool)
            .await
            .expect("Failed to insert test product");

        let customization_group = TestCustomizationGroup::default();
        customization_group
            .insert(&pool)
            .await
            .expect("Failed to insert customization group");

        let customization_option =
            TestCustomizationOption::new(customization_group.id, "Extra Sugar", 5.0);
        customization_option
            .insert(&pool)
            .await
            .expect("Failed to insert customization option");

        Self {
            pool,
            user,
            address,
            product,
            customization_group,
            customization_option,
        }
    }

    async fn cleanup(&self) {
        cleanup_test_data(&self.pool).await;
    }
}

#[tokio::test]
async fn test_order_flow_stock_and_cart() {
    let fixture = TestFixture::new().await;
    
    // Setup Mock S3
    let s3_config = aws_config::defaults(aws_config::BehaviorVersion::latest())
        .region(aws_sdk_s3::config::Region::new("us-east-1"))
        .load()
        .await;
    let s3_client = aws_sdk_s3::Client::new(&s3_config);
    
    // Setup AppState
    let session_store = PostgresSessionStore::new(fixture.pool.clone());
    let state = AppState {
        db: fixture.pool.clone(),
        session_store,
        razorpay: Arc::new(RazorpayConfig {
            key_id: "test_key".to_string(),
            key_secret: "test_secret".to_string(),
            webhook_secret: "test_webhook_secret".to_string(),
        }),
        s3_client,
        s3_bucket: "test-bucket".to_string(),
        s3_public_url: None,
        max_upload_size: 1024 * 1024,
    };

    // 1. Create cart with 2 items
    create_cart_with_items(
        &fixture.pool,
        fixture.user.id,
        fixture.product.id,
        2,
        vec![],
    )
    .await
    .expect("Failed to create cart");

    // Check initial stock (should be 100 from TestFixture default)
    let initial_stock: i32 = sqlx::query_scalar("SELECT stock_quantity FROM products WHERE id = $1")
        .bind(fixture.product.id)
        .fetch_one(&fixture.pool)
        .await
        .unwrap();
    assert_eq!(initial_stock, 100);

    // 2. Create Order
    let payload = CreateOrderRequest {
        address_id: fixture.address.id,
        notes: Some("Test Note".to_string()),
    };

    // Setup AuthUser
    let auth_user_inner = AuthUser {
        id: fixture.user.id,
        email: fixture.user.email.clone(),
        name: fixture.user.name.clone(),
    };

    let order_response = create_order(
        RequiredAuthUser(auth_user_inner.clone()),
        State(state.clone()),
        Json(payload),
    )
    .await
    .expect("Failed to create order");

    let order = order_response.0;

    // 3. Verify Stock Deducted
    let new_stock: i32 = sqlx::query_scalar("SELECT stock_quantity FROM products WHERE id = $1")
        .bind(fixture.product.id)
        .fetch_one(&fixture.pool)
        .await
        .unwrap();
    assert_eq!(new_stock, 98, "Stock should be reduced by 2");

    // 4. Verify Cart Still Exists (Not cleared yet)
    let cart_items_count: i64 = sqlx::query_scalar(
        r#"SELECT COUNT(*) FROM cart_items ci 
           JOIN carts c ON ci.cart_id = c.id 
           WHERE c.user_id = $1"#
    )
    .bind(fixture.user.id)
    .fetch_one(&fixture.pool)
    .await
    .unwrap();
    assert_eq!(cart_items_count, 1, "Cart should NOT be cleared after order creation");

    // 5. Initiate Payment (Manually insert payment record to bypass external API call)
    let razorpay_order_id = "order_test_fake";
    sqlx::query(
        r#"
        INSERT INTO payments (id, order_id, razorpay_order_id, amount, currency, status)
        VALUES ($1, $2, $3, $4, 'INR', 'pending')
        "#
    )
    .bind(Uuid::new_v4())
    .bind(order.id)
    .bind(razorpay_order_id)
    .bind(order.total_amount)
    .execute(&fixture.pool)
    .await
    .expect("Failed to insert mock payment");

    // 6. Verify Payment
    // Mock signature
    // signature = HMAC_SHA256(razorpay_order_id + "|" + razorpay_payment_id, key_secret)
    let razorpay_payment_id = "pay_test_123";
    let data = format!("{}|{}", razorpay_order_id, razorpay_payment_id);
    let mut mac = hmac::Hmac::<sha2::Sha256>::new_from_slice(state.razorpay.key_secret.as_bytes()).unwrap();
    use hmac::Mac;
    mac.update(data.as_bytes());
    let signature = hex::encode(mac.finalize().into_bytes());

    let verify_payload = VerifyPaymentRequest {
        razorpay_order_id: razorpay_order_id.to_string(),
        razorpay_payment_id: razorpay_payment_id.to_string(),
        razorpay_signature: signature,
    };

    let _ = verify_payment(
        RequiredAuthUser(auth_user_inner.clone()),
        State(state),
        Json(verify_payload),
    )
    .await
    .expect("Failed to verify payment");

    // 7. Verify Cart Cleared
    let cart_items_final_count: i64 = sqlx::query_scalar(
        r#"SELECT COUNT(*) FROM cart_items ci 
           JOIN carts c ON ci.cart_id = c.id 
           WHERE c.user_id = $1"#
    )
    .bind(fixture.user.id)
    .fetch_one(&fixture.pool)
    .await
    .unwrap();
    assert_eq!(cart_items_final_count, 0, "Cart SHOULD be cleared after payment verification");

    fixture.cleanup().await;
}