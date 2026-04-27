use deadpool_postgres::Pool;
use serde::{Deserialize, Serialize};
use tokio_postgres::Row;
use uuid::Uuid;

use backend_shared::{map_pool_error_to_app_error, AppError};

pub const BANNER_CONTENT_MODE_STRUCTURED: &str = "structured";
pub const BANNER_CONTENT_MODE_HTML: &str = "html";

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
    pub content_mode: String,
    pub content_html: Option<String>,
    pub content_json: Option<serde_json::Value>,
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
    pub content_mode: String,
    pub content_html: Option<String>,
    pub content_json: Option<serde_json::Value>,
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
                 secondary_button_label, secondary_button_href, media_url, media_kind, content_mode, content_html,
                 content_json, background_type, background_value, overlay_color, text_color, sort_order, is_active
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
                 secondary_button_label, secondary_button_href, media_url, media_kind, content_mode, content_html,
                 content_json, background_type, background_value, overlay_color, text_color, sort_order, is_active
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
    let input = normalize_input(input)?;
    let client = pool.get().await.map_err(map_pool_error_to_app_error)?;
    let id = Uuid::new_v4().to_string();
    client
        .execute(
            "INSERT INTO banner
             (id, title, subtitle, description, primary_button_label, primary_button_href,
              secondary_button_label, secondary_button_href, media_url, media_kind, content_mode, content_html,
              content_json, background_type, background_value, overlay_color, text_color, sort_order, is_active)
             VALUES
             ($1::text::uuid, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)",
            &[
                &id,
                &input.title,
                &input.subtitle,
                &input.description,
                &input.primary_button_label,
                &input.primary_button_href,
                &input.secondary_button_label,
                &input.secondary_button_href,
                &input.media_url,
                &input.media_kind,
                &input.content_mode,
                &input.content_html,
                &input.content_json,
                &input.background_type,
                &input.background_value,
                &input.overlay_color,
                &input.text_color,
                &input.sort_order,
                &input.is_active,
            ],
        )
        .await?;
    get(pool, &id).await
}

pub async fn update(pool: &Pool, banner_id: &str, input: BannerInput) -> Result<Banner, AppError> {
    let input = normalize_input(input)?;
    let client = pool.get().await.map_err(map_pool_error_to_app_error)?;
    let updated = client
        .execute(
            "UPDATE banner SET
             title = $2, subtitle = $3, description = $4, primary_button_label = $5, primary_button_href = $6,
             secondary_button_label = $7, secondary_button_href = $8, media_url = $9, media_kind = $10,
             content_mode = $11, content_html = $12, content_json = $13, background_type = $14, background_value = $15,
             overlay_color = $16, text_color = $17, sort_order = $18, is_active = $19, modified_on = NOW()
             WHERE id = $1::text::uuid",
            &[
                &banner_id,
                &input.title,
                &input.subtitle,
                &input.description,
                &input.primary_button_label,
                &input.primary_button_href,
                &input.secondary_button_label,
                &input.secondary_button_href,
                &input.media_url,
                &input.media_kind,
                &input.content_mode,
                &input.content_html,
                &input.content_json,
                &input.background_type,
                &input.background_value,
                &input.overlay_color,
                &input.text_color,
                &input.sort_order,
                &input.is_active,
            ],
        )
        .await?;
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
             secondary_button_label, secondary_button_href, media_url, media_kind, content_mode, content_html,
             content_json, background_type, background_value, overlay_color, text_color, sort_order, is_active
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
        content_mode: row.get(10),
        content_html: row.get(11),
        content_json: row.get(12),
        background_type: row.get(13),
        background_value: row.get(14),
        overlay_color: row.get(15),
        text_color: row.get(16),
        sort_order: row.get(17),
        is_active: row.get(18),
    }
}

fn normalize_input(mut input: BannerInput) -> Result<BannerInput, AppError> {
    input.title = input.title.trim().to_string();
    input.subtitle = normalize_optional_text(input.subtitle);
    input.description = normalize_optional_text(input.description);
    input.primary_button_label = normalize_optional_text(input.primary_button_label);
    input.primary_button_href = normalize_optional_text(input.primary_button_href);
    input.secondary_button_label = normalize_optional_text(input.secondary_button_label);
    input.secondary_button_href = normalize_optional_text(input.secondary_button_href);
    input.media_url = normalize_optional_text(input.media_url);
    input.background_value = normalize_optional_text(input.background_value);
    input.overlay_color = normalize_optional_text(input.overlay_color);
    input.text_color = normalize_optional_text(input.text_color);
    input.content_mode = normalize_content_mode(&input.content_mode)?;
    input.content_html = normalize_optional_text(input.content_html);

    if input.title.is_empty() {
        return Err(AppError::BadRequest("banner title is required".into()));
    }
    if !matches!(input.media_kind.as_str(), "image" | "video") {
        return Err(AppError::BadRequest(
            "banner media_kind must be image or video".into(),
        ));
    }
    if !matches!(input.background_type.as_str(), "image" | "video" | "gradient" | "solid") {
        return Err(AppError::BadRequest(
            "banner background_type is invalid".into(),
        ));
    }

    if input.content_mode == BANNER_CONTENT_MODE_HTML {
        let html = input.content_html.clone().unwrap_or_default();
        let sanitized = sanitize_banner_html(&html);
        if sanitized.trim().is_empty() {
            return Err(AppError::BadRequest(
                "banner content_html is required when content_mode is html".into(),
            ));
        }
        input.content_html = Some(sanitized);
    } else if let Some(html) = input.content_html.clone() {
        let sanitized = sanitize_banner_html(&html);
        input.content_html = if sanitized.trim().is_empty() {
            None
        } else {
            Some(sanitized)
        };
    }

    Ok(input)
}

fn normalize_content_mode(value: &str) -> Result<String, AppError> {
    let mode = value.trim().to_ascii_lowercase();
    if matches!(mode.as_str(), BANNER_CONTENT_MODE_STRUCTURED | BANNER_CONTENT_MODE_HTML) {
        Ok(mode)
    } else {
        Err(AppError::BadRequest("banner content_mode is invalid".into()))
    }
}

fn normalize_optional_text(value: Option<String>) -> Option<String> {
    value.and_then(|text| {
        let trimmed = text.trim();
        if trimmed.is_empty() {
            None
        } else {
            Some(trimmed.to_string())
        }
    })
}

fn sanitize_banner_html(html: &str) -> String {
    let mut builder = ammonia::Builder::default();
    builder
        .rm_clean_content_tags(["style"])
        .add_tags([
            "a", "article", "aside", "blockquote", "br", "button", "code", "div", "em", "figure",
            "figcaption", "footer", "h1", "h2", "h3", "h4", "h5", "h6", "header", "hr", "img",
            "li", "main", "ol", "p", "pre", "section", "small", "span", "strong", "sub",
            "sup", "table", "tbody", "td", "th", "thead", "tr", "u", "ul", "style",
        ])
        .add_generic_attributes([
            "class", "id", "role", "style", "title", "align", "dir", "lang", "width", "height",
        ])
        .add_tag_attributes("a", ["href", "target", "title"])
        .add_tag_attributes("img", ["src", "alt", "title", "width", "height", "loading", "decoding"]);

    builder.clean(html).to_string()
}

#[cfg(test)]
mod tests {
    use super::*;

    fn base_input() -> BannerInput {
        BannerInput {
            title: "Banner".to_string(),
            subtitle: None,
            description: None,
            primary_button_label: None,
            primary_button_href: None,
            secondary_button_label: None,
            secondary_button_href: None,
            media_url: None,
            media_kind: "image".to_string(),
            content_mode: BANNER_CONTENT_MODE_STRUCTURED.to_string(),
            content_html: None,
            content_json: None,
            background_type: "image".to_string(),
            background_value: None,
            overlay_color: None,
            text_color: None,
            sort_order: 0,
            is_active: true,
        }
    }

    #[test]
    fn sanitizes_html_banner_content() {
        let html = r#"<div onclick="alert(1)"><script>alert(1)</script><a href="javascript:alert(1)">Link</a><img src="https://example.com/x.png" onload="alert(2)" /></div>"#;
        let sanitized = sanitize_banner_html(html);
        assert!(!sanitized.contains("<script"));
        assert!(!sanitized.contains("onclick"));
        assert!(!sanitized.contains("javascript:"));
        assert!(sanitized.contains("https://example.com/x.png"));
    }

    #[test]
    fn html_mode_requires_content() {
        let mut input = base_input();
        input.content_mode = BANNER_CONTENT_MODE_HTML.to_string();
        input.content_html = Some("   ".to_string());

        let error = normalize_input(input).unwrap_err();
        assert!(error.to_string().contains("content_html"));
    }

    #[test]
    fn normalized_html_is_preserved() {
        let mut input = base_input();
        input.content_mode = BANNER_CONTENT_MODE_HTML.to_string();
        input.content_html = Some(r#"<div><strong>Banner</strong></div>"#.to_string());

        let normalized = normalize_input(input).expect("input should normalize");
        assert_eq!(normalized.content_mode, BANNER_CONTENT_MODE_HTML);
        assert_eq!(
            normalized.content_html.as_deref(),
            Some("<div><strong>Banner</strong></div>")
        );
    }
}
