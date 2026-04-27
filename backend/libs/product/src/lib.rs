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
    pub category_ids: Vec<String>,
    pub categories: Vec<String>,
}

#[derive(Debug, Clone, Deserialize)]
pub struct ProductInput {
    pub name: String,
    pub images: Vec<String>,
    pub price: f64,
    pub description: Option<String>,
    pub category_ids: Vec<String>,
}

pub async fn list(pool: &Pool, category_id: Option<&str>) -> Result<serde_json::Value, AppError> {
    let client = pool.get().await.map_err(map_pool_error_to_app_error)?;
    let rows = if let Some(category_id) = category_id {
        client
            .query(
                r#"
            SELECT
                p.id::text,
                p.name,
                p.images,
                p.price,
                p.description,
                COALESCE(
                    ARRAY_AGG(DISTINCT c.id::text) FILTER (WHERE c.id IS NOT NULL),
                    '{}'::text[]
                ) AS category_ids,
                COALESCE(
                    ARRAY_AGG(DISTINCT c.name) FILTER (WHERE c.name IS NOT NULL),
                    '{}'::text[]
                ) AS categories
            FROM product p
            INNER JOIN category_product cp_filter ON cp_filter.product_id = p.id
            LEFT JOIN category_product cp ON cp.product_id = p.id
            LEFT JOIN category c ON c.id = cp.category_id
            WHERE cp_filter.category_id = $1::text::uuid
            GROUP BY p.id, p.name, p.images, p.price, p.description, p.created_on
            ORDER BY p.created_on ASC, p.name ASC
            "#,
                &[&category_id],
            )
            .await?
    } else {
        client
            .query(
                r#"
            SELECT
                p.id::text,
                p.name,
                p.images,
                p.price,
                p.description,
                COALESCE(
                    ARRAY_AGG(DISTINCT c.id::text) FILTER (WHERE c.id IS NOT NULL),
                    '{}'::text[]
                ) AS category_ids,
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
            .await?
    };

    let items = rows.iter().map(map_product_row).collect::<Vec<_>>();

    Ok(serde_json::json!({
        "ok": true,
        "items": items,
    }))
}

pub async fn create(pool: &Pool, input: ProductInput) -> Result<ProductListItem, AppError> {
    validate(&input)?;
    let mut client = pool.get().await.map_err(map_pool_error_to_app_error)?;
    let tx = client.transaction().await?;
    let product_id = Uuid::new_v4().to_string();
    tx.execute(
        "INSERT INTO product (id, name, images, price, description)
         VALUES ($1::text::uuid, $2, $3, $4, $5)",
        &[
            &product_id,
            &input.name,
            &input.images,
            &input.price,
            &input.description,
        ],
    )
    .await?;
    sync_categories(&tx, &product_id, &input.category_ids).await?;
    tx.commit().await?;
    get(pool, &product_id).await
}

pub async fn update(
    pool: &Pool,
    product_id: &str,
    input: ProductInput,
) -> Result<ProductListItem, AppError> {
    validate(&input)?;
    let mut client = pool.get().await.map_err(map_pool_error_to_app_error)?;
    let tx = client.transaction().await?;
    let updated = tx.execute(
        "UPDATE product SET name = $2, images = $3, price = $4, description = $5, modified_on = NOW()
         WHERE id = $1::text::uuid",
        &[&product_id, &input.name, &input.images, &input.price, &input.description],
    ).await?;
    if updated == 0 {
        return Err(AppError::NotFound("product not found".into()));
    }
    tx.execute(
        "DELETE FROM category_product WHERE product_id = $1::text::uuid",
        &[&product_id],
    )
    .await?;
    sync_categories(&tx, product_id, &input.category_ids).await?;
    tx.commit().await?;
    get(pool, product_id).await
}

pub async fn delete(pool: &Pool, product_id: &str) -> Result<(), AppError> {
    let client = pool.get().await.map_err(map_pool_error_to_app_error)?;
    let deleted = client
        .execute(
            "DELETE FROM product WHERE id = $1::text::uuid",
            &[&product_id],
        )
        .await?;
    if deleted == 0 {
        return Err(AppError::NotFound("product not found".into()));
    }
    Ok(())
}

pub async fn get(pool: &Pool, product_id: &str) -> Result<ProductListItem, AppError> {
    let client = pool.get().await.map_err(map_pool_error_to_app_error)?;
    let row = client.query_opt(
        r#"
        SELECT
            p.id::text,
            p.name,
            p.images,
            p.price,
            p.description,
            COALESCE(ARRAY_AGG(DISTINCT c.id::text) FILTER (WHERE c.id IS NOT NULL), '{}'::text[]) AS category_ids,
            COALESCE(ARRAY_AGG(DISTINCT c.name) FILTER (WHERE c.name IS NOT NULL), '{}'::text[]) AS categories
        FROM product p
        LEFT JOIN category_product cp ON cp.product_id = p.id
        LEFT JOIN category c ON c.id = cp.category_id
        WHERE p.id = $1::text::uuid
        GROUP BY p.id, p.name, p.images, p.price, p.description
        "#,
        &[&product_id]
    ).await?;
    row.map(|row| map_product_row(&row))
        .ok_or_else(|| AppError::NotFound("product not found".into()))
}

fn map_product_row(row: &Row) -> ProductListItem {
    ProductListItem {
        id: row.get::<_, String>(0),
        name: row.get(1),
        images: row.get(2),
        price: row.get(3),
        description: row.get(4),
        category_ids: row.get(5),
        categories: row.get(6),
    }
}

async fn sync_categories(
    tx: &deadpool_postgres::Transaction<'_>,
    product_id: &str,
    category_ids: &[String],
) -> Result<(), AppError> {
    for category_id in category_ids {
        tx.execute(
            "INSERT INTO category_product (category_id, product_id)
             VALUES ($1::text::uuid, $2::text::uuid)
             ON CONFLICT DO NOTHING",
            &[&category_id, &product_id],
        )
        .await?;
    }
    Ok(())
}

fn validate(input: &ProductInput) -> Result<(), AppError> {
    if input.name.trim().is_empty() {
        return Err(AppError::BadRequest("product name is required".into()));
    }
    if input.price <= 0.0 {
        return Err(AppError::BadRequest(
            "product price must be greater than zero".into(),
        ));
    }
    Ok(())
}
