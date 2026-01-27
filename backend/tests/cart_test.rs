use axum::{
    body::Body,
    http::{Request, StatusCode},
    Router,
};
use backend::domain::cart::{
    AddToCartRequest, CartCustomizationRequest, CartDto, UpdateCartItemRequest,
};
use backend::handlers;
use backend::infrastructure::session_store::PostgresSessionStore;
use backend::state::AppState;
use sqlx::PgPool;
use tower::ServiceExt;

mod common;
use common::{
    cleanup_test_data, create_test_pool, run_migrations, TestCustomizationGroup,
    TestCustomizationOption, TestProduct, TestUser,
};

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
async fn test_cart_flow() {
    let pool = create_test_pool().await;
    run_migrations(&pool).await;
    cleanup_test_data(&pool).await;

    // Setup Data
    let product = TestProduct::default();
    product.insert(&pool).await.unwrap();

    let group = TestCustomizationGroup::default();
    group.insert(&pool).await.unwrap();

    let option = TestCustomizationOption::new(group.id, "Test Option", 5.0);
    option.insert(&pool).await.unwrap();

    let app = setup_app(pool.clone()).await;
    let cookie = get_auth_cookie(&pool, &app).await;

    // 1. Add to Cart
    let payload = AddToCartRequest {
        product_id: product.id,
        quantity: 2,
        customizations: vec![CartCustomizationRequest {
            group_id: group.id,
            option_id: option.id,
        }],
    };

    let request = Request::builder()
        .method("POST")
        .uri("/api/cart")
        .header("content-type", "application/json")
        .header("cookie", &cookie)
        .body(Body::from(serde_json::to_string(&payload).unwrap()))
        .unwrap();

    let response = app.clone().oneshot(request).await.unwrap();
    assert_eq!(response.status(), StatusCode::OK);

    let body_bytes = axum::body::to_bytes(response.into_body(), usize::MAX)
        .await
        .unwrap();
    eprintln!(
        "Add to cart response: {}",
        String::from_utf8_lossy(&body_bytes)
    );
    let cart: CartDto =
        serde_json::from_slice(&body_bytes).expect("Failed to deserialize cart after add");

    assert_eq!(cart.items.len(), 1, "Cart should have 1 item");
    assert_eq!(cart.items[0].quantity, 2);

    let item_id = cart.items[0].id.expect("Cart item ID should not be None");

    // 2. Get Cart
    let request = Request::builder()
        .method("GET")
        .uri("/api/cart")
        .header("cookie", &cookie)
        .body(Body::empty())
        .unwrap();

    let response = app.clone().oneshot(request).await.unwrap();
    assert_eq!(response.status(), StatusCode::OK);

    // 3. Update Item Quantity
    let update_payload = UpdateCartItemRequest { quantity: 5 };

    let request = Request::builder()
        .method("PUT")
        .uri(format!("/api/cart/items/{}", item_id))
        .header("content-type", "application/json")
        .header("cookie", &cookie)
        .body(Body::from(serde_json::to_string(&update_payload).unwrap()))
        .unwrap();

    let response = app.clone().oneshot(request).await.unwrap();
    assert_eq!(response.status(), StatusCode::OK);

    let body_bytes = axum::body::to_bytes(response.into_body(), usize::MAX)
        .await
        .unwrap();
    eprintln!(
        "Update item response: {}",
        String::from_utf8_lossy(&body_bytes)
    );
    let cart: CartDto =
        serde_json::from_slice(&body_bytes).expect("Failed to deserialize cart after update");
    assert_eq!(cart.items[0].quantity, 5);

    // 4. Remove Item
    let request = Request::builder()
        .method("DELETE")
        .uri(format!("/api/cart/items/{}", item_id))
        .header("cookie", &cookie)
        .body(Body::empty())
        .unwrap();

    let response = app.oneshot(request).await.unwrap();
    assert_eq!(response.status(), StatusCode::OK);

    let body_bytes = axum::body::to_bytes(response.into_body(), usize::MAX)
        .await
        .unwrap();
    eprintln!(
        "Remove item response: {}",
        String::from_utf8_lossy(&body_bytes)
    );
    let cart: CartDto =
        serde_json::from_slice(&body_bytes).expect("Failed to deserialize cart after remove");
    assert!(cart.items.is_empty());
}
