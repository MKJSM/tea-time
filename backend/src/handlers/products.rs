use axum::{extract::{State, Path}, Json};
use crate::domain::models::{Product, CustomizationGroup, CustomizationOption, ProductCustomization};
use crate::state::AppState;
use crate::error::AppError;

pub async fn get_products(
    State(state): State<AppState>,
) -> Result<Json<Vec<Product>>, AppError> {
    let products = sqlx::query_as::<_, Product>(
        "SELECT id, name, description, base_price, category, image_url, is_active, sku, stock_quantity, created_at, updated_at FROM products WHERE is_active = 1"
    )
    .fetch_all(&state.db)
    .await?;

    Ok(Json(products))
}

pub async fn get_product_customizations(
    State(state): State<AppState>,
    Path(product_id): Path<i32>,
) -> Result<Json<Vec<ProductCustomization>>, AppError> {
    // 1. Fetch groups linked to the product
    let groups = sqlx::query_as::<_, CustomizationGroup>(
        r#"
        SELECT cg.* 
        FROM customization_groups cg
        JOIN product_customizations pc ON cg.id = pc.group_id
        WHERE pc.product_id = ?
        ORDER BY pc.display_order
        "#
    )
    .bind(product_id)
    .fetch_all(&state.db)
    .await?;

    let mut result = Vec::new();

    for group in groups {
        let options = sqlx::query_as::<_, CustomizationOption>(
            "SELECT * FROM customization_options WHERE group_id = ? ORDER BY display_order"
        )
        .bind(group.id)
        .fetch_all(&state.db)
        .await?;

        result.push(ProductCustomization {
            group,
            options,
        });
    }

    Ok(Json(result))
}

#[cfg(test)]
mod tests {
    use super::*;
    use axum::{
        body::Body,
        http::{Request, StatusCode},
        routing::get,
        Router,
    };
    use tower::util::ServiceExt;
    use sqlx::sqlite::SqlitePoolOptions;
    use std::sync::Arc;

    #[tokio::test]
    async fn test_get_products_api() {
        dotenvy::dotenv().ok();
        let database_url = "sqlite::memory:";
        let pool = SqlitePoolOptions::new()
            .max_connections(1)
            .connect(database_url)
            .await
            .expect("Failed to connect to the database");

        sqlx::migrate!("./migrations")
            .run(&pool)
            .await
            .expect("Failed to run migrations");

        let state = AppState { db: pool };
        
        let app = Router::new()
            .route("/api/products", get(get_products))
            .with_state(state);

        let response = app
            .oneshot(
                Request::builder()
                    .uri("/api/products")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::OK);
        
        let body_bytes = axum::body::to_bytes(response.into_body(), usize::MAX).await.unwrap();
        let body_str = String::from_utf8(body_bytes.to_vec()).unwrap();
        
        assert!(body_str.contains("Hot Masala Tea"));
    }
}

