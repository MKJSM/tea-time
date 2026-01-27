use axum::{
    body::Body,
    http::{Request, StatusCode},
    Router,
};
use backend::domain::models::{AuthResponse, CreateUserRequest, LoginUserRequest, User};
use backend::handlers;
use backend::infrastructure::session_store::PostgresSessionStore;
use backend::state::AppState;
use sqlx::PgPool;
use tower::ServiceExt; // for oneshot

mod common;
use common::{cleanup_test_data, create_test_pool, run_migrations};

async fn setup_app(pool: PgPool) -> Router {
    let session_store = PostgresSessionStore::new(pool.clone());
    session_store
        .migrate()
        .await
        .expect("Failed to migrate session store");

    let state = AppState::new_mock(pool, session_store).await;

    handlers::build_router(state)
}

#[tokio::test]
async fn test_signup_flow() {
    let pool = create_test_pool().await;
    run_migrations(&pool).await;
    cleanup_test_data(&pool).await;

    let app = setup_app(pool.clone()).await;

    let payload = CreateUserRequest {
        name: "Test User".to_string(),
        email: "signup_test@example.com".to_string(),
        password: "password123".to_string(),
        phone: Some("1234567890".to_string()),
    };

    let request = Request::builder()
        .method("POST")
        .uri("/api/auth/signup")
        .header("content-type", "application/json")
        .body(Body::from(serde_json::to_string(&payload).unwrap()))
        .unwrap();

    let response = app.oneshot(request).await.unwrap();
    assert_eq!(response.status(), StatusCode::OK);

    let body_bytes = axum::body::to_bytes(response.into_body(), usize::MAX)
        .await
        .unwrap();
    let body: AuthResponse = serde_json::from_slice(&body_bytes).unwrap();

    assert_eq!(body.user.email, "signup_test@example.com");
    assert_eq!(body.user.name, "Test User");

    // Verify user in DB
    let saved_user = sqlx::query_as::<_, User>("SELECT * FROM users WHERE email = $1")
        .bind("signup_test@example.com")
        .fetch_one(&pool)
        .await
        .unwrap();
    assert_eq!(saved_user.id, body.user.id);
}

#[tokio::test]
async fn test_login_flow() {
    let pool = create_test_pool().await;
    run_migrations(&pool).await;
    cleanup_test_data(&pool).await;

    // Create user first
    let user_id = uuid::Uuid::new_v4();
    let email = "login_test@example.com";
    let password = "password123";

    // Hash password (manually for test setup)
    let salt =
        argon2::password_hash::SaltString::generate(&mut argon2::password_hash::rand_core::OsRng);
    let argon2 = argon2::Argon2::default();
    let password_hash =
        argon2::password_hash::PasswordHasher::hash_password(&argon2, password.as_bytes(), &salt)
            .unwrap()
            .to_string();

    sqlx::query(
        "INSERT INTO users (id, name, email, phone, password_hash) VALUES ($1, $2, $3, $4, $5)",
    )
    .bind(user_id)
    .bind("Login User")
    .bind(email)
    .bind("0987654321")
    .bind(password_hash)
    .execute(&pool)
    .await
    .unwrap();

    let app = setup_app(pool.clone()).await;

    // Test Login
    let payload = LoginUserRequest {
        email: email.to_string(),
        password: password.to_string(),
    };

    let request = Request::builder()
        .method("POST")
        .uri("/api/auth/login")
        .header("content-type", "application/json")
        .body(Body::from(serde_json::to_string(&payload).unwrap()))
        .unwrap();

    let response = app.oneshot(request).await.unwrap();
    assert_eq!(response.status(), StatusCode::OK);

    // Extract cookie
    let cookie = response
        .headers()
        .get("set-cookie")
        .unwrap()
        .to_str()
        .unwrap();
    assert!(cookie.contains("id=")); // Session cookie name default is "id"

    // Test Get Me (Protected Route)
    // We need to rebuild the app or clone it?
    // `oneshot` consumes the app. We need `tower::Service::call` or rebuild.
    // Rebuilding is easier/safer for state.
    let app = setup_app(pool.clone()).await;

    let request = Request::builder()
        .method("GET")
        .uri("/api/auth/me")
        .header("cookie", cookie)
        .body(Body::empty())
        .unwrap();

    let response = app.oneshot(request).await.unwrap();
    assert_eq!(response.status(), StatusCode::OK);

    let body_bytes = axum::body::to_bytes(response.into_body(), usize::MAX)
        .await
        .unwrap();
    let user: User = serde_json::from_slice(&body_bytes).unwrap();
    assert_eq!(user.email, email);
}

#[tokio::test]
async fn test_logout() {
    let pool = create_test_pool().await;
    run_migrations(&pool).await;
    cleanup_test_data(&pool).await;

    // Setup user & login (simulated by creating session directly?)
    // Or just run full flow. Full flow is safer integration test.
    let app = setup_app(pool.clone()).await;

    // 1. Signup
    let payload = CreateUserRequest {
        name: "Logout User".to_string(),
        email: "logout@example.com".to_string(),
        password: "password123".to_string(),
        phone: None,
    };

    let request = Request::builder()
        .method("POST")
        .uri("/api/auth/signup")
        .header("content-type", "application/json")
        .body(Body::from(serde_json::to_string(&payload).unwrap()))
        .unwrap();

    let response = app.oneshot(request).await.unwrap();
    let cookie = response
        .headers()
        .get("set-cookie")
        .unwrap()
        .to_str()
        .unwrap()
        .to_string();

    // 2. Logout
    let app = setup_app(pool.clone()).await;
    let request = Request::builder()
        .method("POST")
        .uri("/api/auth/logout")
        .header("cookie", &cookie)
        .body(Body::empty())
        .unwrap();

    let response = app.oneshot(request).await.unwrap();
    assert_eq!(response.status(), StatusCode::OK);

    // 3. Try Get Me (Should fail)
    let app = setup_app(pool.clone()).await;
    let request = Request::builder()
        .method("GET")
        .uri("/api/auth/me")
        .header("cookie", &cookie)
        .body(Body::empty())
        .unwrap();

    let response = app.oneshot(request).await.unwrap();
    assert_eq!(response.status(), StatusCode::UNAUTHORIZED);
}
