use chrono::{DateTime, Utc};
use deadpool_postgres::Pool;
use serde::{Deserialize, Serialize};
use tokio_postgres::Row;
use uuid::Uuid;

use backend_shared::{map_pool_error_to_app_error, AppError};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Category {
    pub id: Uuid,
    pub name: String,
    pub images: Vec<String>,
    pub created_on: DateTime<Utc>,
    pub modified_on: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CategoryListItem {
    pub id: String,
    pub name: String,
    pub images: Vec<String>,
    pub product_count: i64,
}

pub async fn list(pool: &Pool) -> Result<serde_json::Value, AppError> {
    let client = pool.get().await.map_err(map_pool_error_to_app_error)?;
    let rows = client
        .query(
            r#"
            SELECT
                c.id::text,
                c.name,
                c.images,
                COUNT(cp.product_id)::bigint AS product_count
            FROM category c
            LEFT JOIN category_product cp ON cp.category_id = c.id
            GROUP BY c.id, c.name, c.images, c.created_on
            ORDER BY c.created_on ASC, c.name ASC
            "#,
            &[],
        )
        .await?;

    let items = rows.iter().map(map_category_row).collect::<Vec<_>>();

    Ok(serde_json::json!({
        "ok": true,
        "items": items,
    }))
}

fn map_category_row(row: &Row) -> CategoryListItem {
    CategoryListItem {
        id: row.get::<_, String>(0),
        name: row.get(1),
        images: row.get(2),
        product_count: row.get(3),
    }
}
