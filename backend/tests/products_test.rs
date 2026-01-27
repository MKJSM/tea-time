use axum::{
    body::Body,
    http::{Request, StatusCode},
    Router,
};
use backend::handlers;
use backend::handlers::products::{PaginatedResponse, ProductResponse};
use backend::infrastructure::session_store::PostgresSessionStore;
use backend::state::AppState;
use sqlx::PgPool;
use tower::ServiceExt;
use uuid::Uuid;

mod common;
use common::{cleanup_test_data, create_test_pool, run_migrations, TestProduct};

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
async fn test_get_products_pagination() {
    let pool = create_test_pool().await;
    run_migrations(&pool).await;
    cleanup_test_data(&pool).await;

    // Create 15 products
    for i in 1..=15 {
        let product = TestProduct {
            name: format!("Tea {}", i),
            ..TestProduct::default()
        };
        product.insert(&pool).await.unwrap();
    }

    let app = setup_app(pool.clone()).await;

    // Default Page 1 (Limit 12)
    let request = Request::builder()
        .method("GET")
        .uri("/api/products")
        .body(Body::empty())
        .unwrap();

    let response = app.oneshot(request).await.unwrap();
    assert_eq!(response.status(), StatusCode::OK);

    let body_bytes = axum::body::to_bytes(response.into_body(), usize::MAX)
        .await
        .unwrap();
    let body: PaginatedResponse<ProductResponse> = serde_json::from_slice(&body_bytes).unwrap();

    assert_eq!(body.data.len(), 12);
    assert_eq!(body.total, 15);
    assert_eq!(body.total_pages, 2);

    // Page 2
    let app = setup_app(pool.clone()).await;
    let request = Request::builder()
        .method("GET")
        .uri("/api/products?page=2&limit=12")
        .body(Body::empty())
        .unwrap();

    let response = app.oneshot(request).await.unwrap();
    let body_bytes = axum::body::to_bytes(response.into_body(), usize::MAX)
        .await
        .unwrap();
    let body: PaginatedResponse<ProductResponse> = serde_json::from_slice(&body_bytes).unwrap();

    assert_eq!(body.data.len(), 3);
}

#[tokio::test]
async fn test_get_products_search() {
    let pool = create_test_pool().await;
    run_migrations(&pool).await;
    cleanup_test_data(&pool).await;

    let p1 = TestProduct {
        name: "Green Tea".to_string(),
        ..Default::default()
    };
    p1.insert(&pool).await.unwrap();

    let p2 = TestProduct {
        name: "Black Coffee".to_string(),
        ..Default::default()
    };
    p2.insert(&pool).await.unwrap();

    let app = setup_app(pool.clone()).await;

    let request = Request::builder()
        .method("GET")
        .uri("/api/products?q=Green")
        .body(Body::empty())
        .unwrap();

    let response = app.oneshot(request).await.unwrap();
    let body_bytes = axum::body::to_bytes(response.into_body(), usize::MAX)
        .await
        .unwrap();
    let body: PaginatedResponse<ProductResponse> = serde_json::from_slice(&body_bytes).unwrap();

    assert_eq!(body.data.len(), 1);
    assert_eq!(body.data[0].name, "Green Tea");
}

#[tokio::test]
async fn test_get_products_category_filter() {
    let pool = create_test_pool().await;
    run_migrations(&pool).await;
    cleanup_test_data(&pool).await;

    let p1 = TestProduct {
        name: "Jasmine Tea".to_string(),
        category: serde_json::json!(["Herbal", "Tea"]),
        ..Default::default()
    };
    p1.insert(&pool).await.unwrap();

    let p2 = TestProduct {
        name: "Espresso".to_string(),
        category: serde_json::json!(["Coffee"]),
        ..Default::default()
    };
    p2.insert(&pool).await.unwrap();

    let app = setup_app(pool.clone()).await;

    let request = Request::builder()
        .method("GET")
        .uri("/api/products?category=Tea")
        .body(Body::empty())
        .unwrap();

    let response = app.oneshot(request).await.unwrap();
    let body_bytes = axum::body::to_bytes(response.into_body(), usize::MAX)
        .await
        .unwrap();
    let body: PaginatedResponse<ProductResponse> = serde_json::from_slice(&body_bytes).unwrap();

    assert_eq!(body.data.len(), 1);
    assert_eq!(body.data[0].name, "Jasmine Tea");
}

#[tokio::test]
async fn test_get_product_by_id() {
    let pool = create_test_pool().await;
    run_migrations(&pool).await;
    cleanup_test_data(&pool).await;

    let product = TestProduct::default();
    product.insert(&pool).await.unwrap();

    let app = setup_app(pool.clone()).await;

    let uri = format!("/api/products/{}", product.id);
    let request = Request::builder()
        .method("GET")
        .uri(&uri)
        .body(Body::empty())
        .unwrap();

    let response = app.oneshot(request).await.unwrap();
    assert_eq!(response.status(), StatusCode::OK);

    let body_bytes = axum::body::to_bytes(response.into_body(), usize::MAX)
        .await
        .unwrap();
    let body: ProductResponse = serde_json::from_slice(&body_bytes).unwrap();
    assert_eq!(body.id, product.id);

    // 404 check
    let app = setup_app(pool.clone()).await;
    let request = Request::builder()
        .method("GET")
        .uri(format!("/api/products/{}", Uuid::new_v4()))
        .body(Body::empty())
        .unwrap();
    let response = app.oneshot(request).await.unwrap();
    assert_eq!(response.status(), StatusCode::NOT_FOUND);
}

#[tokio::test]
async fn test_get_categories() {
    let pool = create_test_pool().await;
    run_migrations(&pool).await;
    cleanup_test_data(&pool).await;

    let p1 = TestProduct {
        category: serde_json::json!(["A"]),
        ..Default::default()
    };
    p1.insert(&pool).await.unwrap();
    let p2 = TestProduct {
        id: Uuid::new_v4(),
        category: serde_json::json!(["B"]),
        ..Default::default()
    };
    p2.insert(&pool).await.unwrap();
    let p3 = TestProduct {
        id: Uuid::new_v4(),
        category: serde_json::json!(["A"]),
        ..Default::default()
    };
    p3.insert(&pool).await.unwrap();

    let app = setup_app(pool.clone()).await;

    let request = Request::builder()
        .method("GET")
        .uri("/api/products/categories")
        .body(Body::empty())
        .unwrap();

    let response = app.oneshot(request).await.unwrap();
    let body_bytes = axum::body::to_bytes(response.into_body(), usize::MAX)
        .await
        .unwrap();
    let categories: Vec<String> = serde_json::from_slice(&body_bytes).unwrap();

    assert_eq!(categories.len(), 2);
    assert!(categories.contains(&"A".to_string()));
    assert!(categories.contains(&"B".to_string()));
}
