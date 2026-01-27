use axum::{
    body::Body,
    http::{Request, StatusCode},
    Router,
};
use backend::domain::order::{Order, OrderStatusHistory, Payment};
use backend::handlers;
use backend::infrastructure::session_store::PostgresSessionStore;
use backend::state::{AppState, RazorpayConfig};
use hmac::{Hmac, Mac};
use sha2::Sha256;
use sqlx::PgPool;
use std::sync::Arc;
use tower::ServiceExt; // for oneshot
use uuid::Uuid;

mod common;
use common::*;

type HmacSha256 = Hmac<Sha256>;

async fn setup_app(pool: PgPool, webhook_secret: &str) -> Router {
    let session_store = PostgresSessionStore::new(pool.clone());
    session_store
        .migrate()
        .await
        .expect("Failed to migrate session store");

    let mut state = AppState::new_mock(pool, session_store).await;

    // Override webhook secret for the test
    let razorpay = Arc::new(RazorpayConfig {
        key_id: "test_key".to_string(),
        key_secret: "test_secret".to_string(),
        webhook_secret: webhook_secret.to_string(),
    });
    state.razorpay = razorpay;

    handlers::build_router(state)
}

fn generate_signature(body: &str, secret: &str) -> String {
    let mut mac = HmacSha256::new_from_slice(secret.as_bytes()).unwrap();
    mac.update(body.as_bytes());
    hex::encode(mac.finalize().into_bytes())
}

#[tokio::test]
async fn test_razorpay_webhook_captured_flow() {
    let pool = create_test_pool().await;
    run_migrations(&pool).await;
    cleanup_test_data(&pool).await;

    let webhook_secret = "super_secret_webhook";
    let app = setup_app(pool.clone(), webhook_secret).await;

    // 1. Setup: Create an order and a pending payment
    let user = TestUser::default();
    user.insert(&pool).await.unwrap();

    let address = TestAddress::new(user.id);
    address.insert(&pool).await.unwrap();

    let order_id = create_test_order(&pool, user.id, address.id, "pending", 100.0)
        .await
        .unwrap();

    let razorpay_order_id = "order_999";
    sqlx::query(
        "INSERT INTO payments (id, order_id, razorpay_order_id, amount, status) VALUES ($1, $2, $3, $4, 'pending')"
    )
    .bind(Uuid::new_v4())
    .bind(order_id)
    .bind(razorpay_order_id)
    .bind(100.0)
    .execute(&pool)
    .await
    .unwrap();

    // 2. Mock Webhook Body
    let payload = serde_json::json!({
        "event": "payment.captured",
        "payload": {
            "payment": {
                "entity": {
                    "id": "pay_captured_123",
                    "order_id": razorpay_order_id,
                    "amount": 10000,
                    "currency": "INR",
                    "status": "captured",
                    "method": "upi"
                }
            }
        }
    });
    let body_str = serde_json::to_string(&payload).unwrap();
    let signature = generate_signature(&body_str, webhook_secret);

    // 3. Send Webhook Request
    let request = Request::builder()
        .method("POST")
        .uri("/api/webhooks/razorpay")
        .header("X-Razorpay-Signature", signature)
        .header("content-type", "application/json")
        .body(Body::from(body_str))
        .unwrap();

    let response = app.oneshot(request).await.unwrap();
    assert_eq!(response.status(), StatusCode::OK);

    // 4. Verify Database Updates
    // Check Payment
    let payment: Payment = sqlx::query_as("SELECT * FROM payments WHERE razorpay_order_id = $1")
        .bind(razorpay_order_id)
        .fetch_one(&pool)
        .await
        .unwrap();

    assert_eq!(payment.status, "captured");
    assert_eq!(
        payment.razorpay_payment_id,
        Some("pay_captured_123".to_string())
    );
    assert_eq!(payment.method, Some("upi".to_string()));
    assert!(payment.webhook_verified);
    assert!(payment.razorpay_webhook_payload.is_some());

    // Check Order
    let order: Order = sqlx::query_as("SELECT * FROM orders WHERE id = $1")
        .bind(order_id)
        .fetch_one(&pool)
        .await
        .unwrap();
    assert_eq!(order.status, "confirmed");
    assert!(order.confirmed_at.is_some());

    // Check History
    let history: Vec<OrderStatusHistory> = sqlx::query_as(
        "SELECT * FROM order_status_history WHERE order_id = $1 ORDER BY created_at DESC",
    )
    .bind(order_id)
    .fetch_all(&pool)
    .await
    .unwrap();
    assert!(history.iter().any(|h| h.to_status == "confirmed"
        && h.notes
            .as_ref()
            .map(|n| n.contains("webhook"))
            .unwrap_or(false)));
}

#[tokio::test]
async fn test_razorpay_webhook_failed_flow() {
    let pool = create_test_pool().await;
    run_migrations(&pool).await;
    cleanup_test_data(&pool).await;

    let webhook_secret = "super_secret_webhook";
    let app = setup_app(pool.clone(), webhook_secret).await;

    let user = TestUser::default();
    user.insert(&pool).await.unwrap();
    let address = TestAddress::new(user.id);
    address.insert(&pool).await.unwrap();

    let order_id = create_test_order(&pool, user.id, address.id, "pending", 100.0)
        .await
        .unwrap();
    let razorpay_order_id = "order_failed_999";

    sqlx::query(
        "INSERT INTO payments (id, order_id, razorpay_order_id, amount, status) VALUES ($1, $2, $3, $4, 'pending')"
    )
    .bind(Uuid::new_v4())
    .bind(order_id)
    .bind(razorpay_order_id)
    .bind(100.0)
    .execute(&pool)
    .await
    .unwrap();

    let payload = serde_json::json!({
        "event": "payment.failed",
        "payload": {
            "payment": {
                "entity": {
                    "id": "pay_failed_123",
                    "order_id": razorpay_order_id,
                    "amount": 10000,
                    "currency": "INR",
                    "status": "failed",
                    "error_code": "BAD_REQUEST_ERROR",
                    "error_description": "Payment failed due to some reason"
                }
            }
        }
    });
    let body_str = serde_json::to_string(&payload).unwrap();
    let signature = generate_signature(&body_str, webhook_secret);

    let request = Request::builder()
        .method("POST")
        .uri("/api/webhooks/razorpay")
        .header("X-Razorpay-Signature", signature)
        .body(Body::from(body_str))
        .unwrap();

    let response = app.oneshot(request).await.unwrap();
    assert_eq!(response.status(), StatusCode::OK);

    let payment: Payment = sqlx::query_as("SELECT * FROM payments WHERE razorpay_order_id = $1")
        .bind(razorpay_order_id)
        .fetch_one(&pool)
        .await
        .unwrap();

    assert_eq!(payment.status, "failed");
    assert_eq!(payment.error_code, Some("BAD_REQUEST_ERROR".to_string()));
    assert!(payment.webhook_verified);
}

#[tokio::test]
async fn test_razorpay_webhook_authorized_flow() {
    let pool = create_test_pool().await;
    run_migrations(&pool).await;
    cleanup_test_data(&pool).await;

    let webhook_secret = "super_secret_webhook";
    let app = setup_app(pool.clone(), webhook_secret).await;

    let user = TestUser::default();
    user.insert(&pool).await.unwrap();
    let address = TestAddress::new(user.id);
    address.insert(&pool).await.unwrap();

    let order_id = create_test_order(&pool, user.id, address.id, "pending", 150.0)
        .await
        .unwrap();
    let razorpay_order_id = "order_auth_999";

    sqlx::query(
        "INSERT INTO payments (id, order_id, razorpay_order_id, amount, status) VALUES ($1, $2, $3, $4, 'pending')"
    )
    .bind(Uuid::new_v4())
    .bind(order_id)
    .bind(razorpay_order_id)
    .bind(150.0)
    .execute(&pool)
    .await
    .unwrap();

    let payload = serde_json::json!({
        "event": "payment.authorized",
        "payload": {
            "payment": {
                "entity": {
                    "id": "pay_auth_123",
                    "order_id": razorpay_order_id,
                    "amount": 15000,
                    "currency": "INR",
                    "status": "authorized",
                    "method": "card"
                }
            }
        }
    });
    let body_str = serde_json::to_string(&payload).unwrap();
    let signature = generate_signature(&body_str, webhook_secret);

    let request = Request::builder()
        .method("POST")
        .uri("/api/webhooks/razorpay")
        .header("X-Razorpay-Signature", signature)
        .body(Body::from(body_str))
        .unwrap();

    let response = app.oneshot(request).await.unwrap();
    assert_eq!(response.status(), StatusCode::OK);

    let payment: Payment = sqlx::query_as("SELECT * FROM payments WHERE razorpay_order_id = $1")
        .bind(razorpay_order_id)
        .fetch_one(&pool)
        .await
        .unwrap();

    assert_eq!(payment.status, "authorized");
    assert_eq!(
        payment.razorpay_payment_id,
        Some("pay_auth_123".to_string())
    );
    assert!(payment.webhook_verified);
}

#[tokio::test]
async fn test_razorpay_webhook_order_paid_flow() {
    let pool = create_test_pool().await;
    run_migrations(&pool).await;
    cleanup_test_data(&pool).await;

    let webhook_secret = "super_secret_webhook";
    let app = setup_app(pool.clone(), webhook_secret).await;

    let user = TestUser::default();
    user.insert(&pool).await.unwrap();
    let address = TestAddress::new(user.id);
    address.insert(&pool).await.unwrap();

    let order_id = create_test_order(&pool, user.id, address.id, "pending", 200.0)
        .await
        .unwrap();
    let razorpay_order_id = "order_paid_999";

    sqlx::query(
        "INSERT INTO payments (id, order_id, razorpay_order_id, amount, status) VALUES ($1, $2, $3, $4, 'pending')"
    )
    .bind(Uuid::new_v4())
    .bind(order_id)
    .bind(razorpay_order_id)
    .bind(200.0)
    .execute(&pool)
    .await
    .unwrap();

    let payload = serde_json::json!({
        "event": "order.paid",
        "payload": {
            "order": {
                "entity": {
                    "id": razorpay_order_id,
                    "amount": 20000,
                    "status": "paid"
                }
            }
        }
    });
    let body_str = serde_json::to_string(&payload).unwrap();
    let signature = generate_signature(&body_str, webhook_secret);

    let request = Request::builder()
        .method("POST")
        .uri("/api/webhooks/razorpay")
        .header("X-Razorpay-Signature", signature)
        .body(Body::from(body_str))
        .unwrap();

    let response = app.oneshot(request).await.unwrap();
    assert_eq!(response.status(), StatusCode::OK);

    let order: Order = sqlx::query_as("SELECT * FROM orders WHERE id = $1")
        .bind(order_id)
        .fetch_one(&pool)
        .await
        .unwrap();
    assert_eq!(order.status, "confirmed");
}

#[tokio::test]
async fn test_razorpay_webhook_refund_flow() {
    let pool = create_test_pool().await;
    run_migrations(&pool).await;
    cleanup_test_data(&pool).await;

    let webhook_secret = "super_secret_webhook";
    let app = setup_app(pool.clone(), webhook_secret).await;

    let user = TestUser::default();
    user.insert(&pool).await.unwrap();
    let address = TestAddress::new(user.id);
    address.insert(&pool).await.unwrap();

    let order_id = create_test_order(&pool, user.id, address.id, "confirmed", 300.0)
        .await
        .unwrap();
    let razorpay_order_id = "order_refund_999";
    let razorpay_payment_id = "pay_refund_123";

    sqlx::query(
        "INSERT INTO payments (id, order_id, razorpay_order_id, razorpay_payment_id, amount, status) VALUES ($1, $2, $3, $4, $5, 'captured')"
    )
    .bind(Uuid::new_v4())
    .bind(order_id)
    .bind(razorpay_order_id)
    .bind(razorpay_payment_id)
    .bind(300.0)
    .execute(&pool)
    .await
    .unwrap();

    let payload = serde_json::json!({
        "event": "refund.created",
        "payload": {
            "refund": {
                "entity": {
                    "id": "rfnd_123",
                    "payment_id": razorpay_payment_id,
                    "amount": 30000,
                    "currency": "INR",
                    "status": "processed",
                    "order_id": razorpay_order_id
                }
            }
        }
    });
    let body_str = serde_json::to_string(&payload).unwrap();
    let signature = generate_signature(&body_str, webhook_secret);

    let request = Request::builder()
        .method("POST")
        .uri("/api/webhooks/razorpay")
        .header("X-Razorpay-Signature", signature)
        .body(Body::from(body_str))
        .unwrap();

    let response = app.oneshot(request).await.unwrap();
    assert_eq!(response.status(), StatusCode::OK);

    let payment: Payment = sqlx::query_as("SELECT * FROM payments WHERE razorpay_payment_id = $1")
        .bind(razorpay_payment_id)
        .fetch_one(&pool)
        .await
        .unwrap();

    assert_eq!(payment.status, "refunded");
    assert_eq!(payment.refund_id, Some("rfnd_123".to_string()));
    assert_eq!(payment.refund_amount, Some(300.0));
}

#[tokio::test]
async fn test_razorpay_webhook_invalid_signature() {
    let pool = create_test_pool().await;
    run_migrations(&pool).await;
    cleanup_test_data(&pool).await;

    let webhook_secret = "super_secret_webhook";
    let app = setup_app(pool.clone(), webhook_secret).await;

    let payload = serde_json::json!({
        "event": "payment.captured",
        "payload": {}
    });
    let body_str = serde_json::to_string(&payload).unwrap();

    let request = Request::builder()
        .method("POST")
        .uri("/api/webhooks/razorpay")
        .header("X-Razorpay-Signature", "wrong_signature")
        .body(Body::from(body_str))
        .unwrap();

    let response = app.oneshot(request).await.unwrap();
    assert_eq!(response.status(), StatusCode::BAD_REQUEST);
}
