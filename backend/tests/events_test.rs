use axum::{
    body::Body,
    http::{Request, StatusCode},
    Router,
};
use backend::domain::models::EventBookingResponse;
use backend::handlers;
use backend::infrastructure::session_store::PostgresSessionStore;
use backend::state::AppState;
use serde_json::json;
use sqlx::PgPool;
use tower::ServiceExt;

mod common;
use common::{
    cleanup_test_data, count_event_bookings_by_email, create_test_pool, event_booking_status,
    run_migrations, TestEventBooking, TestUser,
};

// ── App setup helpers ─────────────────────────────────────────────────────────

async fn setup_app(pool: PgPool) -> Router {
    let session_store = PostgresSessionStore::new(pool.clone());
    session_store
        .migrate()
        .await
        .expect("Failed to migrate session store");

    let state = AppState::new_mock(pool, session_store).await;
    handlers::build_router(state)
}

/// Signs up a user and returns their session cookie string.
async fn login_user(app: Router, email: &str, password: &str, name: &str) -> String {
    use backend::domain::models::CreateUserRequest;

    let payload = CreateUserRequest {
        name: name.to_string(),
        email: email.to_string(),
        password: password.to_string(),
        phone: Some("9876543210".to_string()),
    };

    let request = Request::builder()
        .method("POST")
        .uri("/api/auth/signup")
        .header("content-type", "application/json")
        .body(Body::from(serde_json::to_string(&payload).unwrap()))
        .unwrap();

    let response = app.oneshot(request).await.unwrap();
    response
        .headers()
        .get("set-cookie")
        .expect("No session cookie on signup")
        .to_str()
        .unwrap()
        .to_string()
}

// ── Valid booking payload helper ──────────────────────────────────────────────

fn valid_booking_payload() -> serde_json::Value {
    json!({
        "contact_name": "Priya Sharma",
        "contact_phone": "9876543210",
        "contact_email": "priya@example.com",
        "event_name": "Priya's Wedding",
        "event_type": "wedding",
        "event_date": "2026-06-20",
        "time_slot": "evening",
        "venue_address": "45 Lotus Hall, Coimbatore, Tamil Nadu",
        "headcount_total": 150,
        "headcount_adults": 120,
        "headcount_kids": 20,
        "headcount_seniors": 10,
        "selected_items": [
            {
                "product_id": "prod-1",
                "product_name": "Masala Chai",
                "quantity": 100,
                "unit_price": 25.0
            }
        ],
        "estimated_base": 2500.0,
        "estimated_deposit": 400.0,
        "estimated_delivery": 200.0,
        "estimated_tax": 135.0,
        "estimated_total": 3235.0,
        "notes": null
    })
}

// ──────────────────────────────────────────────────────────────────────────────
// Test 1: Guest can create an event booking
// ──────────────────────────────────────────────────────────────────────────────

#[tokio::test]
async fn test_create_event_booking_guest() {
    let pool = create_test_pool().await;
    run_migrations(&pool).await;
    cleanup_test_data(&pool).await;

    let app = setup_app(pool.clone()).await;
    let payload = valid_booking_payload();

    let request = Request::builder()
        .method("POST")
        .uri("/api/events")
        .header("content-type", "application/json")
        .body(Body::from(serde_json::to_string(&payload).unwrap()))
        .unwrap();

    let response = app.oneshot(request).await.unwrap();
    assert_eq!(
        response.status(),
        StatusCode::CREATED,
        "Guest event booking should return 201 CREATED"
    );

    let body_bytes = axum::body::to_bytes(response.into_body(), usize::MAX)
        .await
        .unwrap();
    let body: EventBookingResponse = serde_json::from_slice(&body_bytes).unwrap();

    assert_eq!(body.event_name, "Priya's Wedding");
    assert_eq!(body.status, "pending");
    assert!(!body.id.is_nil(), "Response should contain a valid UUID");
    assert!(
        body.message.contains("30–60 minutes"),
        "Response message should mention callback window"
    );
}

// ──────────────────────────────────────────────────────────────────────────────
// Test 2: Authenticated user booking stores user_id
// ──────────────────────────────────────────────────────────────────────────────

#[tokio::test]
async fn test_create_event_booking_authenticated() {
    let pool = create_test_pool().await;
    run_migrations(&pool).await;
    cleanup_test_data(&pool).await;

    // Sign up and get session cookie
    let app = setup_app(pool.clone()).await;
    let cookie = login_user(
        app,
        "auth_event@example.com",
        "password123",
        "Auth Event User",
    )
    .await;

    let app = setup_app(pool.clone()).await;
    let mut payload = valid_booking_payload();
    payload["contact_email"] = json!("auth_event@example.com");

    let request = Request::builder()
        .method("POST")
        .uri("/api/events")
        .header("content-type", "application/json")
        .header("cookie", &cookie)
        .body(Body::from(serde_json::to_string(&payload).unwrap()))
        .unwrap();

    let response = app.oneshot(request).await.unwrap();
    assert_eq!(response.status(), StatusCode::CREATED);

    // Verify user_id was stored in DB
    let user_id_stored: Option<uuid::Uuid> = sqlx::query_scalar(
        "SELECT user_id FROM event_bookings WHERE contact_email = 'auth_event@example.com'",
    )
    .fetch_optional(&pool)
    .await
    .unwrap()
    .flatten();

    assert!(
        user_id_stored.is_some(),
        "Authenticated booking should have user_id in DB"
    );
}

// ──────────────────────────────────────────────────────────────────────────────
// Test 3: Missing required field returns 400
// ──────────────────────────────────────────────────────────────────────────────

#[tokio::test]
async fn test_create_event_booking_missing_contact_name() {
    let pool = create_test_pool().await;
    run_migrations(&pool).await;
    cleanup_test_data(&pool).await;

    let app = setup_app(pool.clone()).await;
    let mut payload = valid_booking_payload();
    payload["contact_name"] = json!(""); // empty = fails min=1 validation

    let request = Request::builder()
        .method("POST")
        .uri("/api/events")
        .header("content-type", "application/json")
        .body(Body::from(serde_json::to_string(&payload).unwrap()))
        .unwrap();

    let response = app.oneshot(request).await.unwrap();
    assert_eq!(
        response.status(),
        StatusCode::BAD_REQUEST,
        "Empty contact_name should return 400"
    );
}

// ──────────────────────────────────────────────────────────────────────────────
// Test 4: Headcount below minimum returns 400
// ──────────────────────────────────────────────────────────────────────────────

#[tokio::test]
async fn test_create_event_booking_zero_headcount() {
    let pool = create_test_pool().await;
    run_migrations(&pool).await;
    cleanup_test_data(&pool).await;

    let app = setup_app(pool.clone()).await;
    let mut payload = valid_booking_payload();
    payload["headcount_total"] = json!(0); // fails min=1

    let request = Request::builder()
        .method("POST")
        .uri("/api/events")
        .header("content-type", "application/json")
        .body(Body::from(serde_json::to_string(&payload).unwrap()))
        .unwrap();

    let response = app.oneshot(request).await.unwrap();
    assert_eq!(
        response.status(),
        StatusCode::BAD_REQUEST,
        "headcount_total=0 should return 400"
    );
}

// ──────────────────────────────────────────────────────────────────────────────
// Test 5: Invalid event_date format returns 400
// ──────────────────────────────────────────────────────────────────────────────

#[tokio::test]
async fn test_create_event_booking_invalid_date() {
    let pool = create_test_pool().await;
    run_migrations(&pool).await;
    cleanup_test_data(&pool).await;

    let app = setup_app(pool.clone()).await;
    let mut payload = valid_booking_payload();
    payload["event_date"] = json!("not-a-date");

    let request = Request::builder()
        .method("POST")
        .uri("/api/events")
        .header("content-type", "application/json")
        .body(Body::from(serde_json::to_string(&payload).unwrap()))
        .unwrap();

    let response = app.oneshot(request).await.unwrap();
    assert_eq!(
        response.status(),
        StatusCode::BAD_REQUEST,
        "Invalid event_date format should return 400"
    );
}

// ──────────────────────────────────────────────────────────────────────────────
// Test 6: Invalid email returns 400
// ──────────────────────────────────────────────────────────────────────────────

#[tokio::test]
async fn test_create_event_booking_invalid_email() {
    let pool = create_test_pool().await;
    run_migrations(&pool).await;
    cleanup_test_data(&pool).await;

    let app = setup_app(pool.clone()).await;
    let mut payload = valid_booking_payload();
    payload["contact_email"] = json!("not-an-email");

    let request = Request::builder()
        .method("POST")
        .uri("/api/events")
        .header("content-type", "application/json")
        .body(Body::from(serde_json::to_string(&payload).unwrap()))
        .unwrap();

    let response = app.oneshot(request).await.unwrap();
    assert_eq!(
        response.status(),
        StatusCode::BAD_REQUEST,
        "Invalid email should return 400"
    );
}

// ──────────────────────────────────────────────────────────────────────────────
// Test 7: Booking is persisted in DB with correct fields
// ──────────────────────────────────────────────────────────────────────────────

#[tokio::test]
async fn test_create_event_booking_stored_in_db() {
    let pool = create_test_pool().await;
    run_migrations(&pool).await;
    cleanup_test_data(&pool).await;

    let unique_email = format!("db_test_{}@example.com", uuid::Uuid::new_v4().simple());

    let app = setup_app(pool.clone()).await;
    let mut payload = valid_booking_payload();
    payload["contact_email"] = json!(unique_email);

    let request = Request::builder()
        .method("POST")
        .uri("/api/events")
        .header("content-type", "application/json")
        .body(Body::from(serde_json::to_string(&payload).unwrap()))
        .unwrap();

    let response = app.oneshot(request).await.unwrap();
    assert_eq!(response.status(), StatusCode::CREATED);

    // Verify DB row
    let count = count_event_bookings_by_email(&pool, &unique_email).await;
    assert_eq!(count, 1, "Exactly one booking should be stored in DB");

    // Verify status is 'pending'
    let row_id = sqlx::query_scalar::<_, uuid::Uuid>(
        "SELECT id FROM event_bookings WHERE contact_email = $1",
    )
    .bind(&unique_email)
    .fetch_one(&pool)
    .await
    .unwrap();

    let status = event_booking_status(&pool, row_id).await;
    assert_eq!(status.as_deref(), Some("pending"));

    // Verify estimated_total stored correctly
    let stored_total: f64 =
        sqlx::query_scalar("SELECT estimated_total FROM event_bookings WHERE id = $1")
            .bind(row_id)
            .fetch_one(&pool)
            .await
            .unwrap();
    assert!(
        (stored_total - 3235.0).abs() < 0.01,
        "Stored estimated_total should equal 3235.0, got {}",
        stored_total
    );
}

// ──────────────────────────────────────────────────────────────────────────────
// Test 8: GET /api/events requires authentication
// ──────────────────────────────────────────────────────────────────────────────

#[tokio::test]
async fn test_list_event_bookings_requires_auth() {
    let pool = create_test_pool().await;
    run_migrations(&pool).await;
    cleanup_test_data(&pool).await;

    let app = setup_app(pool.clone()).await;

    let request = Request::builder()
        .method("GET")
        .uri("/api/events")
        .body(Body::empty())
        .unwrap();

    let response = app.oneshot(request).await.unwrap();
    assert_eq!(
        response.status(),
        StatusCode::UNAUTHORIZED,
        "GET /api/events without session should return 401"
    );
}

// ──────────────────────────────────────────────────────────────────────────────
// Test 9: GET /api/events returns all bookings for authenticated user
// ──────────────────────────────────────────────────────────────────────────────

#[tokio::test]
async fn test_list_event_bookings_returns_all() {
    let pool = create_test_pool().await;
    run_migrations(&pool).await;
    cleanup_test_data(&pool).await;

    // Insert 3 bookings directly via fixture
    for i in 0..3 {
        let booking = TestEventBooking {
            contact_email: format!("guest{}@list-test.com", i),
            event_name: format!("Event {}", i),
            ..Default::default()
        };
        booking.insert(&pool).await.unwrap();
    }

    // Sign up to get session
    let app = setup_app(pool.clone()).await;
    let cookie = login_user(
        app,
        "list_auth@example.com",
        "password123",
        "List Auth User",
    )
    .await;

    let app = setup_app(pool.clone()).await;
    let request = Request::builder()
        .method("GET")
        .uri("/api/events")
        .header("cookie", &cookie)
        .body(Body::empty())
        .unwrap();

    let response = app.oneshot(request).await.unwrap();
    assert_eq!(
        response.status(),
        StatusCode::OK,
        "Authenticated GET /api/events should return 200"
    );

    let body_bytes = axum::body::to_bytes(response.into_body(), usize::MAX)
        .await
        .unwrap();
    let body: serde_json::Value = serde_json::from_slice(&body_bytes).unwrap();

    let data = body["data"]
        .as_array()
        .expect("Response should have 'data' array");
    assert_eq!(data.len(), 3, "Should return all 3 bookings");
    assert_eq!(
        body["total"].as_u64().unwrap(),
        3,
        "total field should be 3"
    );
}
