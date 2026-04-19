use chrono::{DateTime, Utc};
use deadpool_postgres::Pool;
use serde::{Deserialize, Serialize};
use tokio_postgres::Row;
use uuid::Uuid;

use backend_shared::{map_pool_error_to_app_error, AppError};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Product {
    pub id: Uuid,
    pub name: String,
    pub images: Vec<String>,
    pub price: f64,
    pub description: Option<String>,
    pub created_on: DateTime<Utc>,
    pub modified_on: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CategoryProduct {
    pub category_id: Uuid,
    pub product_id: Uuid,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProductListItem {
    pub id: String,
    pub name: String,
    pub images: Vec<String>,
    pub price: f64,
    pub description: Option<String>,
    pub categories: Vec<String>,
}

pub async fn list(pool: &Pool) -> Result<serde_json::Value, AppError> {
    let client = pool.get().await.map_err(map_pool_error_to_app_error)?;
    let rows = client
        .query(
            r#"
            SELECT
                p.id::text,
                p.name,
                p.images,
                p.price,
                p.description,
                COALESCE(
                    ARRAY_AGG(DISTINCT c.name) FILTER (WHERE c.name IS NOT NULL),
                    '{}'::text[]
                ) AS categories
            FROM product p
            LEFT JOIN category_product cp ON cp.product_id = p.id
            LEFT JOIN category c ON c.id = cp.category_id
            GROUP BY p.id, p.name, p.images, p.price, p.description, p.created_on
            ORDER BY p.created_on ASC, p.name ASC
            "#,
            &[],
        )
        .await?;

    let items = rows.iter().map(map_product_row).collect::<Vec<_>>();

    Ok(serde_json::json!({
        "ok": true,
        "items": items,
    }))
}

fn map_product_row(row: &Row) -> ProductListItem {
    ProductListItem {
        id: row.get::<_, String>(0),
        name: row.get(1),
        images: row.get(2),
        price: row.get(3),
        description: row.get(4),
        categories: row.get(5),
    }
}
