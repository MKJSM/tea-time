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

#[derive(Debug, Clone, Deserialize)]
pub struct CategoryInput {
    pub name: String,
    pub images: Vec<String>,
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

pub async fn create(pool: &Pool, input: CategoryInput) -> Result<CategoryListItem, AppError> {
    validate(&input)?;
    let client = pool.get().await.map_err(map_pool_error_to_app_error)?;
    let category_id = Uuid::new_v4().to_string();
    client.execute(
        "INSERT INTO category (id, name, images) VALUES ($1::text::uuid, $2, $3)",
        &[&category_id, &input.name, &input.images]
    ).await?;
    get(pool, &category_id).await
}

pub async fn update(pool: &Pool, category_id: &str, input: CategoryInput) -> Result<CategoryListItem, AppError> {
    validate(&input)?;
    let client = pool.get().await.map_err(map_pool_error_to_app_error)?;
    let updated = client.execute(
        "UPDATE category SET name = $2, images = $3, modified_on = NOW() WHERE id = $1::text::uuid",
        &[&category_id, &input.name, &input.images]
    ).await?;
    if updated == 0 {
        return Err(AppError::NotFound("category not found".into()));
    }
    get(pool, category_id).await
}

pub async fn delete(pool: &Pool, category_id: &str) -> Result<(), AppError> {
    let client = pool.get().await.map_err(map_pool_error_to_app_error)?;
    let deleted = client.execute("DELETE FROM category WHERE id = $1::text::uuid", &[&category_id]).await?;
    if deleted == 0 {
        return Err(AppError::NotFound("category not found".into()));
    }
    Ok(())
}

pub async fn get(pool: &Pool, category_id: &str) -> Result<CategoryListItem, AppError> {
    let client = pool.get().await.map_err(map_pool_error_to_app_error)?;
    let row = client.query_opt(
        "SELECT c.id::text, c.name, c.images, COUNT(cp.product_id)::bigint AS product_count
         FROM category c LEFT JOIN category_product cp ON cp.category_id = c.id
         WHERE c.id = $1::text::uuid
         GROUP BY c.id, c.name, c.images",
        &[&category_id]
    ).await?;
    row.map(|row| map_category_row(&row)).ok_or_else(|| AppError::NotFound("category not found".into()))
}

fn map_category_row(row: &Row) -> CategoryListItem {
    CategoryListItem {
        id: row.get::<_, String>(0),
        name: row.get(1),
        images: row.get(2),
        product_count: row.get(3),
    }
}

fn validate(input: &CategoryInput) -> Result<(), AppError> {
    if input.name.trim().is_empty() {
        return Err(AppError::BadRequest("category name is required".into()));
    }
    Ok(())
}
