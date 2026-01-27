use axum::{
    body::Body,
    http::{Request, StatusCode},
    Router,
};
use backend::domain::models::Product;
use backend::handlers;
use backend::infrastructure::session_store::PostgresSessionStore;
use backend::state::AppState;
use sqlx::PgPool;
use tower::ServiceExt;

mod common;
use common::{cleanup_test_data, create_test_pool, run_migrations, TestProduct, TestUser};

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
                "password": "test"
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
async fn test_favorites_flow() {
    let pool = create_test_pool().await;
    run_migrations(&pool).await;
    cleanup_test_data(&pool).await;

    let app = setup_app(pool.clone()).await;
    let cookie = get_auth_cookie(&pool, &app).await;

    let product = TestProduct::default();
    product.insert(&pool).await.unwrap();

    // 1. Add Favorite
    let request = Request::builder()
        .method("POST")
        .uri(format!("/api/products/{}/favorite", product.id))
        .header("cookie", &cookie)
        .body(Body::empty())
        .unwrap();

    let response = app.clone().oneshot(request).await.unwrap();
    assert_eq!(response.status(), StatusCode::CREATED);

    // ...

    // 4. Remove Favorite
    let request = Request::builder()
        .method("DELETE")
        .uri(format!("/api/products/{}/favorite", product.id))
        .header("cookie", &cookie)
        .body(Body::empty())
        .unwrap();

    let response = app.clone().oneshot(request).await.unwrap();
    assert_eq!(response.status(), StatusCode::NO_CONTENT);

    // Verify removal
    let request = Request::builder()
        .method("GET")
        .uri("/api/favorites")
        .header("cookie", &cookie)
        .body(Body::empty())
        .unwrap();

    let response = app.clone().oneshot(request).await.unwrap();
    let body_bytes = axum::body::to_bytes(response.into_body(), usize::MAX)
        .await
        .unwrap();
    let favorites: Vec<Product> = serde_json::from_slice(&body_bytes).unwrap();
    assert!(favorites.is_empty());
}
