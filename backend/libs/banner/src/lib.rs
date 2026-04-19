use deadpool_postgres::Pool;
use serde::{Deserialize, Serialize};
use tokio_postgres::Row;
use uuid::Uuid;

use backend_shared::{map_pool_error_to_app_error, AppError};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Banner {
    pub id: String,
    pub title: String,
    pub subtitle: Option<String>,
    pub description: Option<String>,
    pub primary_button_label: Option<String>,
    pub primary_button_href: Option<String>,
    pub secondary_button_label: Option<String>,
    pub secondary_button_href: Option<String>,
    pub media_url: Option<String>,
    pub media_kind: String,
    pub background_type: String,
    pub background_value: Option<String>,
    pub overlay_color: Option<String>,
    pub text_color: Option<String>,
    pub sort_order: i32,
    pub is_active: bool,
}

#[derive(Debug, Clone, Deserialize)]
pub struct BannerInput {
    pub title: String,
    pub subtitle: Option<String>,
    pub description: Option<String>,
    pub primary_button_label: Option<String>,
    pub primary_button_href: Option<String>,
    pub secondary_button_label: Option<String>,
    pub secondary_button_href: Option<String>,
    pub media_url: Option<String>,
    pub media_kind: String,
    pub background_type: String,
    pub background_value: Option<String>,
    pub overlay_color: Option<String>,
    pub text_color: Option<String>,
    pub sort_order: i32,
    pub is_active: bool,
}

pub async fn list_active(pool: &Pool) -> Result<serde_json::Value, AppError> {
    list(pool, true).await
}

pub async fn list_admin(pool: &Pool) -> Result<serde_json::Value, AppError> {
    list(pool, false).await
}

async fn list(pool: &Pool, active_only: bool) -> Result<serde_json::Value, AppError> {
    let client = pool.get().await.map_err(map_pool_error_to_app_error)?;
    let rows = if active_only {
        client
            .query(
                "SELECT id::text, title, subtitle, description, primary_button_label, primary_button_href,
                 secondary_button_label, secondary_button_href, media_url, media_kind, background_type,
                 background_value, overlay_color, text_color, sort_order, is_active
                 FROM banner
                 WHERE is_active = TRUE
                 ORDER BY sort_order ASC, created_on ASC",
                &[],
            )
            .await?
    } else {
        client
            .query(
                "SELECT id::text, title, subtitle, description, primary_button_label, primary_button_href,
                 secondary_button_label, secondary_button_href, media_url, media_kind, background_type,
                 background_value, overlay_color, text_color, sort_order, is_active
                 FROM banner
                 ORDER BY sort_order ASC, created_on ASC",
                &[],
            )
            .await?
    };

    Ok(serde_json::json!({
        "ok": true,
        "items": rows.iter().map(map_banner).collect::<Vec<_>>(),
    }))
}

pub async fn create(pool: &Pool, input: BannerInput) -> Result<Banner, AppError> {
    validate(&input)?;
    let client = pool.get().await.map_err(map_pool_error_to_app_error)?;
    let id = Uuid::new_v4().to_string();
    client.execute(
        "INSERT INTO banner
         (id, title, subtitle, description, primary_button_label, primary_button_href,
          secondary_button_label, secondary_button_href, media_url, media_kind, background_type,
          background_value, overlay_color, text_color, sort_order, is_active)
         VALUES
         ($1::text::uuid, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)",
        &[
            &id, &input.title, &input.subtitle, &input.description, &input.primary_button_label,
            &input.primary_button_href, &input.secondary_button_label, &input.secondary_button_href,
            &input.media_url, &input.media_kind, &input.background_type, &input.background_value,
            &input.overlay_color, &input.text_color, &input.sort_order, &input.is_active,
        ],
    ).await?;
    get(pool, &id).await
}

pub async fn update(pool: &Pool, banner_id: &str, input: BannerInput) -> Result<Banner, AppError> {
    validate(&input)?;
    let client = pool.get().await.map_err(map_pool_error_to_app_error)?;
    let updated = client.execute(
        "UPDATE banner SET
         title = $2, subtitle = $3, description = $4, primary_button_label = $5, primary_button_href = $6,
         secondary_button_label = $7, secondary_button_href = $8, media_url = $9, media_kind = $10,
         background_type = $11, background_value = $12, overlay_color = $13, text_color = $14,
         sort_order = $15, is_active = $16, modified_on = NOW()
         WHERE id = $1::text::uuid",
        &[
            &banner_id, &input.title, &input.subtitle, &input.description, &input.primary_button_label,
            &input.primary_button_href, &input.secondary_button_label, &input.secondary_button_href,
            &input.media_url, &input.media_kind, &input.background_type, &input.background_value,
            &input.overlay_color, &input.text_color, &input.sort_order, &input.is_active,
        ],
    ).await?;
    if updated == 0 {
        return Err(AppError::NotFound("banner not found".into()));
    }
    get(pool, banner_id).await
}

pub async fn delete(pool: &Pool, banner_id: &str) -> Result<(), AppError> {
    let client = pool.get().await.map_err(map_pool_error_to_app_error)?;
    let deleted = client
        .execute("DELETE FROM banner WHERE id = $1::text::uuid", &[&banner_id])
        .await?;
    if deleted == 0 {
        return Err(AppError::NotFound("banner not found".into()));
    }
    Ok(())
}

pub async fn get(pool: &Pool, banner_id: &str) -> Result<Banner, AppError> {
    let client = pool.get().await.map_err(map_pool_error_to_app_error)?;
    let row = client
        .query_opt(
            "SELECT id::text, title, subtitle, description, primary_button_label, primary_button_href,
             secondary_button_label, secondary_button_href, media_url, media_kind, background_type,
             background_value, overlay_color, text_color, sort_order, is_active
             FROM banner WHERE id = $1::text::uuid",
            &[&banner_id],
        )
        .await?;
    row.map(|row| map_banner(&row))
        .ok_or_else(|| AppError::NotFound("banner not found".into()))
}

fn map_banner(row: &Row) -> Banner {
    Banner {
        id: row.get(0),
        title: row.get(1),
        subtitle: row.get(2),
        description: row.get(3),
        primary_button_label: row.get(4),
        primary_button_href: row.get(5),
        secondary_button_label: row.get(6),
        secondary_button_href: row.get(7),
        media_url: row.get(8),
        media_kind: row.get(9),
        background_type: row.get(10),
        background_value: row.get(11),
        overlay_color: row.get(12),
        text_color: row.get(13),
        sort_order: row.get(14),
        is_active: row.get(15),
    }
}

fn validate(input: &BannerInput) -> Result<(), AppError> {
    if input.title.trim().is_empty() {
        return Err(AppError::BadRequest("banner title is required".into()));
    }
    if !matches!(input.media_kind.as_str(), "image" | "video") {
        return Err(AppError::BadRequest("banner media_kind must be image or video".into()));
    }
    if !matches!(input.background_type.as_str(), "image" | "video" | "gradient" | "solid") {
        return Err(AppError::BadRequest("banner background_type is invalid".into()));
    }
    Ok(())
}
