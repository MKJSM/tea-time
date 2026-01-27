use axum::http::StatusCode;
use axum_test::TestServer;
use backend::handlers;
use backend::infrastructure::session_store::PostgresSessionStore;
use backend::state::AppState;
use serde_json::json;
use sqlx::PgPool;

mod common;
use common::*;

async fn setup_app(pool: PgPool) -> axum::Router {
    let session_store = PostgresSessionStore::new(pool.clone());
    session_store
        .migrate()
        .await
        .expect("Failed to migrate session store");

    let state = AppState::new_mock(pool, session_store).await;

    handlers::build_router(state)
}

#[tokio::test]
async fn test_profile_flow() {
    let pool = create_test_pool().await;
    run_migrations(&pool).await;

    let app = setup_app(pool.clone()).await;
    let mut server = TestServer::new(app).unwrap();
    server.save_cookies();

    // 1. Signup
    let signup_payload = json!({
        "name": "Initial Name",
        "email": "profile@example.com",
        "password": "password123",
        "phone": "1234567890"
    });

    let response = server.post("/api/auth/signup").json(&signup_payload).await;
    response.assert_status(StatusCode::OK);

    // 2. Get Profile
    let response = server.get("/api/user/profile").await;
    response.assert_status(StatusCode::OK);
    let profile = response.json::<serde_json::Value>();
    assert_eq!(profile["name"], "Initial Name");
    assert_eq!(profile["theme"], "light");

    // 3. Update Profile
    let update_payload = json!({
        "name": "Updated Name",
        "phone": "0987654321",
        "image_url": "https://example.com/avatar.jpg"
    });

    let response = server.put("/api/user/profile").json(&update_payload).await;
    response.assert_status(StatusCode::OK);
    let updated_profile = response.json::<serde_json::Value>();
    assert_eq!(updated_profile["name"], "Updated Name");
    assert_eq!(updated_profile["phone"], "0987654321");
    assert_eq!(
        updated_profile["image_url"],
        "https://example.com/avatar.jpg"
    );

    // 4. Update Theme
    let theme_payload = json!({ "theme": "dark" });
    server
        .put("/api/user/theme")
        .json(&theme_payload)
        .await
        .assert_status(StatusCode::OK);

    let response = server.get("/api/user/profile").await;
    assert_eq!(response.json::<serde_json::Value>()["theme"], "dark");

    // 5. Change Password (must contain uppercase, lowercase, and digit)
    let password_payload = json!({
        "old_password": "password123",
        "new_password": "NewPassword123"
    });
    server
        .post("/api/user/password")
        .json(&password_payload)
        .await
        .assert_status(StatusCode::OK);

    // Verify login with new password
    let login_payload = json!({
        "email": "profile@example.com",
        "password": "NewPassword123"
    });
    server
        .post("/api/auth/login")
        .json(&login_payload)
        .await
        .assert_status(StatusCode::OK);

    // 6. Devices
    let response = server.get("/api/user/devices").await;
    response.assert_status(StatusCode::OK);
    let devices = response.json::<Vec<serde_json::Value>>();
    assert!(!devices.is_empty());
}
