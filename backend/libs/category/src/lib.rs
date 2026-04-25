use chrono::{DateTime, Utc};
use deadpool_postgres::Pool;
use serde::{Deserialize, Serialize};
use tokio_postgres::Row;
use uuid::Uuid;

use backend_shared::{is_unique_violation, map_pool_error_to_app_error, AppError};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Category {
    pub id: Uuid,
    pub name: String,
    pub slug: String,
    pub images: Vec<String>,
    pub created_on: DateTime<Utc>,
    pub modified_on: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CategoryListItem {
    pub id: String,
    pub name: String,
    pub slug: String,
    pub images: Vec<String>,
    pub product_count: i64,
}

#[derive(Debug, Clone, Deserialize)]
pub struct CategoryInput {
    pub name: String,
    pub slug: String,
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
                c.slug,
                c.images,
                COUNT(cp.product_id)::bigint AS product_count
            FROM category c
            LEFT JOIN category_product cp ON cp.category_id = c.id
            GROUP BY c.id, c.name, c.slug, c.images, c.created_on
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
    let input = normalize_input(input)?;
    let client = pool.get().await.map_err(map_pool_error_to_app_error)?;
    ensure_slug_available(&client, &input.slug, None).await?;
    let category_id = Uuid::new_v4().to_string();
    client
        .execute(
            "INSERT INTO category (id, name, slug, images) VALUES ($1::text::uuid, $2, $3, $4)",
            &[&category_id, &input.name, &input.slug, &input.images],
        )
        .await
        .map_err(map_category_unique_error)?;
    get(pool, &category_id).await
}

pub async fn update(pool: &Pool, category_id: &str, input: CategoryInput) -> Result<CategoryListItem, AppError> {
    let input = normalize_input(input)?;
    let client = pool.get().await.map_err(map_pool_error_to_app_error)?;
    ensure_slug_available(&client, &input.slug, Some(category_id)).await?;
    let updated = client
        .execute(
            "UPDATE category SET name = $2, slug = $3, images = $4, modified_on = NOW() WHERE id = $1::text::uuid",
            &[&category_id, &input.name, &input.slug, &input.images],
        )
        .await
        .map_err(map_category_unique_error)?;
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
        "SELECT c.id::text, c.name, c.slug, c.images, COUNT(cp.product_id)::bigint AS product_count
         FROM category c LEFT JOIN category_product cp ON cp.category_id = c.id
         WHERE c.id = $1::text::uuid
         GROUP BY c.id, c.name, c.slug, c.images",
        &[&category_id]
    ).await?;
    row.map(|row| map_category_row(&row)).ok_or_else(|| AppError::NotFound("category not found".into()))
}

fn map_category_row(row: &Row) -> CategoryListItem {
    CategoryListItem {
        id: row.get::<_, String>(0),
        name: row.get(1),
        slug: row.get(2),
        images: row.get(3),
        product_count: row.get(4),
    }
}

async fn ensure_slug_available(
    client: &deadpool_postgres::Client,
    slug: &str,
    exclude_category_id: Option<&str>,
) -> Result<(), AppError> {
    let row = if let Some(category_id) = exclude_category_id {
        client
            .query_opt(
                "SELECT 1 FROM category WHERE slug = $1 AND id <> $2::text::uuid LIMIT 1",
                &[&slug, &category_id],
            )
            .await?
    } else {
        client
            .query_opt("SELECT 1 FROM category WHERE slug = $1 LIMIT 1", &[&slug])
            .await?
    };

    if row.is_some() {
        return Err(AppError::BadRequest("category slug is already in use".into()));
    }

    Ok(())
}

fn normalize_input(mut input: CategoryInput) -> Result<CategoryInput, AppError> {
    input.name = input.name.trim().to_string();
    input.slug = normalize_slug(&input.slug)?;
    input.images = input
        .images
        .into_iter()
        .map(|image| image.trim().to_string())
        .filter(|image| !image.is_empty())
        .collect();
    validate(&input)?;
    Ok(input)
}

fn validate(input: &CategoryInput) -> Result<(), AppError> {
    if input.name.is_empty() {
        return Err(AppError::BadRequest("category name is required".into()));
    }
    Ok(())
}

fn normalize_slug(value: &str) -> Result<String, AppError> {
    let slug = value.trim().to_ascii_lowercase();
    if slug.is_empty() {
        return Err(AppError::BadRequest("category slug is required".into()));
    }

    if !slug.split('-').all(|part| {
        !part.is_empty() && part.chars().all(|ch| ch.is_ascii_lowercase() || ch.is_ascii_digit())
    }) {
        return Err(AppError::BadRequest(
            "category slug must use lowercase letters, numbers, and hyphens only".into(),
        ));
    }

    Ok(slug)
}

fn map_category_unique_error(error: tokio_postgres::Error) -> AppError {
    if is_unique_violation(&error) {
        AppError::BadRequest("category name or slug must be unique".into())
    } else {
        error.into()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn base_input() -> CategoryInput {
        CategoryInput {
            name: "Black Tea".to_string(),
            slug: "black-tea".to_string(),
            images: vec!["https://example.com/tea.jpg".to_string()],
        }
    }

    #[test]
    fn normalizes_slug() {
        let mut input = base_input();
        input.slug = "  Morning-Mix  ".to_string();

        let normalized = normalize_input(input).expect("input should normalize");
        assert_eq!(normalized.slug, "morning-mix");
    }

    #[test]
    fn rejects_invalid_slug() {
        let mut input = base_input();
        input.slug = "Not a slug!".to_string();

        let error = normalize_input(input).unwrap_err();
        assert!(error.to_string().contains("slug"));
    }

    #[test]
    fn validates_category_name() {
        let mut input = base_input();
        input.name = "   ".to_string();

        let error = normalize_input(input).unwrap_err();
        assert!(error.to_string().contains("name"));
    }
}
