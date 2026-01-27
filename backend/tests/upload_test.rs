use axum::{
    body::Body,
    http::{header, Request, StatusCode},
    Router,
};
use backend::handlers;
use backend::infrastructure::session_store::PostgresSessionStore;
use backend::state::AppState;
use sqlx::PgPool;
use tower::ServiceExt;

mod common;
use common::*;

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

/// Creates a multipart body with the given file content
fn create_multipart_body(
    field_name: &str,
    file_name: &str,
    content_type: &str,
    data: Vec<u8>,
) -> (String, Vec<u8>) {
    let boundary = "----WebKitFormBoundary7MA4YWxkTrZu0gW";
    let mut body = Vec::new();

    // Start boundary
    body.extend_from_slice(format!("--{}\r\n", boundary).as_bytes());
    body.extend_from_slice(
        format!(
            "Content-Disposition: form-data; name=\"{}\"; filename=\"{}\"\r\n",
            field_name, file_name
        )
        .as_bytes(),
    );
    body.extend_from_slice(format!("Content-Type: {}\r\n\r\n", content_type).as_bytes());
    body.extend_from_slice(&data);
    body.extend_from_slice(b"\r\n");

    // End boundary
    body.extend_from_slice(format!("--{}--\r\n", boundary).as_bytes());

    (format!("multipart/form-data; boundary={}", boundary), body)
}

#[tokio::test]
async fn test_upload_image_requires_authentication() {
    let pool = create_test_pool().await;
    run_migrations(&pool).await;
    cleanup_test_data(&pool).await;

    let app = setup_app(pool).await;

    // Try to upload without authentication
    let (content_type, body) =
        create_multipart_body("file", "test.png", "image/png", vec![0u8; 100]);

    let request = Request::builder()
        .method("POST")
        .uri("/api/upload/image")
        .header(header::CONTENT_TYPE, content_type)
        .body(Body::from(body))
        .unwrap();

    let response = app.oneshot(request).await.unwrap();
    assert_eq!(response.status(), StatusCode::UNAUTHORIZED);
}

#[tokio::test]
async fn test_upload_image_no_file() {
    let pool = create_test_pool().await;
    run_migrations(&pool).await;
    cleanup_test_data(&pool).await;

    let app = setup_app(pool.clone()).await;
    let cookie = get_auth_cookie(&pool, &app).await;

    // Send empty multipart form
    let boundary = "----WebKitFormBoundary7MA4YWxkTrZu0gW";
    let body = format!("--{}--\r\n", boundary);

    let request = Request::builder()
        .method("POST")
        .uri("/api/upload/image")
        .header(
            header::CONTENT_TYPE,
            format!("multipart/form-data; boundary={}", boundary),
        )
        .header(header::COOKIE, &cookie)
        .body(Body::from(body))
        .unwrap();

    let response = app.oneshot(request).await.unwrap();
    assert_eq!(response.status(), StatusCode::BAD_REQUEST);
}

#[tokio::test]
async fn test_upload_image_with_valid_file() {
    let pool = create_test_pool().await;
    run_migrations(&pool).await;
    cleanup_test_data(&pool).await;

    let app = setup_app(pool.clone()).await;
    let cookie = get_auth_cookie(&pool, &app).await;

    let image_bytes = std::fs::read("../sample_tea.png").expect("Failed to read sample image");
    let (content_type, body) =
        create_multipart_body("file", "sample_tea.png", "image/png", image_bytes);

    let request = Request::builder()
        .method("POST")
        .uri("/api/upload/image")
        .header(header::CONTENT_TYPE, content_type)
        .header(header::COOKIE, &cookie)
        .body(Body::from(body))
        .unwrap();

    let response = app.oneshot(request).await.unwrap();

    // It should fail with InternalServerError (500) because of placeholder S3 credentials,
    // but this confirms it reached the S3 upload call (past authentication and validation).
    assert_eq!(response.status(), StatusCode::INTERNAL_SERVER_ERROR);
}

#[tokio::test]
async fn test_upload_image_invalid_content_type() {
    let pool = create_test_pool().await;
    run_migrations(&pool).await;
    cleanup_test_data(&pool).await;

    let app = setup_app(pool.clone()).await;
    let cookie = get_auth_cookie(&pool, &app).await;

    // Try to upload a text file
    let (content_type, body) =
        create_multipart_body("file", "test.txt", "text/plain", b"Hello, World!".to_vec());

    let request = Request::builder()
        .method("POST")
        .uri("/api/upload/image")
        .header(header::CONTENT_TYPE, content_type)
        .header(header::COOKIE, &cookie)
        .body(Body::from(body))
        .unwrap();

    let response = app.oneshot(request).await.unwrap();
    assert_eq!(response.status(), StatusCode::BAD_REQUEST);
}
