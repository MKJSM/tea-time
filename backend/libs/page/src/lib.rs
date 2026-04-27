use std::collections::BTreeSet;

use deadpool_postgres::Pool;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use tokio_postgres::Row;
use uuid::Uuid;

use backend_shared::{map_pool_error_to_app_error, AppError};

const PAGE_SLUG: &str = "home";

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum PageBlock {
    Section {
        id: String,
        props: SectionBlockProps,
        children: Vec<PageBlock>,
    },
    Container {
        id: String,
        props: ContainerBlockProps,
        children: Vec<PageBlock>,
    },
    Heading {
        id: String,
        props: HeadingBlockProps,
    },
    Paragraph {
        id: String,
        props: ParagraphBlockProps,
    },
    Image {
        id: String,
        props: ImageBlockProps,
    },
    Button {
        id: String,
        props: ButtonBlockProps,
    },
    Divider {
        id: String,
        props: DividerBlockProps,
    },
    Spacer {
        id: String,
        props: SpacerBlockProps,
    },
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct SectionBlockProps {
    pub title: Option<String>,
    pub subtitle: Option<String>,
    pub description: Option<String>,
    pub eyebrow: Option<String>,
    pub background_type: Option<String>,
    pub background_value: Option<String>,
    pub overlay_color: Option<String>,
    pub text_color: Option<String>,
    pub media_url: Option<String>,
    pub media_kind: Option<String>,
    pub primary_button_label: Option<String>,
    pub primary_button_href: Option<String>,
    pub secondary_button_label: Option<String>,
    pub secondary_button_href: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct ContainerBlockProps {
    pub layout: Option<String>,
    pub gap: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct HeadingBlockProps {
    pub text: String,
    pub level: Option<u8>,
    pub align: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct ParagraphBlockProps {
    pub text: String,
    pub align: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct ImageBlockProps {
    pub src: String,
    pub alt: String,
    pub caption: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct ButtonBlockProps {
    pub label: String,
    pub href: String,
    pub variant: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct DividerBlockProps {
    pub style: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct SpacerBlockProps {
    pub height: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PageDocument {
    pub id: String,
    pub slug: String,
    pub title: String,
    pub subtitle: Option<String>,
    pub description: Option<String>,
    pub blocks: Vec<PageBlock>,
    pub is_published: bool,
    pub published_on: Option<String>,
    pub created_on: String,
    pub modified_on: String,
}

#[derive(Debug, Clone, Deserialize)]
pub struct PageInput {
    pub title: String,
    pub subtitle: Option<String>,
    pub description: Option<String>,
    pub blocks: Vec<PageBlock>,
}

pub async fn get_admin(pool: &Pool) -> Result<PageDocument, AppError> {
    load(pool, false).await
}

pub async fn get_public(pool: &Pool) -> Result<PageDocument, AppError> {
    load(pool, true).await
}

pub async fn save(pool: &Pool, input: PageInput) -> Result<PageDocument, AppError> {
    let input = normalize_input(input)?;
    let client = pool.get().await.map_err(map_pool_error_to_app_error)?;
    let id = Uuid::new_v4().to_string();
    let content_json = serde_json::to_value(&input.blocks)
        .map_err(|error| AppError::Config(format!("failed to serialize page content: {error}")))?;

    client
        .execute(
            r#"
            INSERT INTO homepage_page
                (id, slug, title, subtitle, description, content_json, is_published, published_on)
            VALUES
                ($1::text::uuid, $2, $3, $4, $5, $6, FALSE, NULL)
            ON CONFLICT (slug) DO UPDATE SET
                title = EXCLUDED.title,
                subtitle = EXCLUDED.subtitle,
                description = EXCLUDED.description,
                content_json = EXCLUDED.content_json,
                modified_on = NOW()
            "#,
            &[
                &id,
                &PAGE_SLUG,
                &input.title,
                &input.subtitle,
                &input.description,
                &content_json,
            ],
        )
        .await?;

    get_admin(pool).await
}

pub async fn publish(pool: &Pool) -> Result<PageDocument, AppError> {
    set_publish_state(pool, true).await
}

pub async fn unpublish(pool: &Pool) -> Result<PageDocument, AppError> {
    set_publish_state(pool, false).await
}

pub async fn delete(pool: &Pool) -> Result<(), AppError> {
    let client = pool.get().await.map_err(map_pool_error_to_app_error)?;
    client
        .execute("DELETE FROM homepage_page WHERE slug = $1", &[&PAGE_SLUG])
        .await?;
    Ok(())
}

async fn set_publish_state(pool: &Pool, is_published: bool) -> Result<PageDocument, AppError> {
    loop {
        let client = pool.get().await.map_err(map_pool_error_to_app_error)?;
        let updated = client
            .execute(
                r#"
                UPDATE homepage_page
                SET is_published = $2, published_on = CASE WHEN $2 THEN NOW() ELSE NULL END, modified_on = NOW()
                WHERE slug = $1
                "#,
                &[&PAGE_SLUG, &is_published],
            )
            .await?;

        if updated == 0 {
            save(pool, default_input()).await?;
            continue;
        }

        return get_admin(pool).await;
    }
}

async fn load(pool: &Pool, published_only: bool) -> Result<PageDocument, AppError> {
    let client = pool.get().await.map_err(map_pool_error_to_app_error)?;
    let row = client
        .query_opt(
            r#"
            SELECT
                id::text,
                slug,
                title,
                subtitle,
                description,
                content_json,
                is_published,
                published_on::text,
                created_on::text,
                modified_on::text
            FROM homepage_page
            WHERE slug = $1
              AND ($2::bool = FALSE OR is_published = TRUE)
            ORDER BY created_on DESC
            LIMIT 1
            "#,
            &[&PAGE_SLUG, &published_only],
        )
        .await?;

    match row {
        Some(row) => map_page(&row),
        None => Ok(default_page(published_only)),
    }
}

fn map_page(row: &Row) -> Result<PageDocument, AppError> {
    let blocks_value: Value = row.get(5);
    let blocks: Vec<PageBlock> = serde_json::from_value(blocks_value)
        .map_err(|error| AppError::Config(format!("invalid page content in database: {error}")))?;

    Ok(PageDocument {
        id: row.get(0),
        slug: row.get(1),
        title: row.get(2),
        subtitle: row.get(3),
        description: row.get(4),
        blocks,
        is_published: row.get(6),
        published_on: row.get(7),
        created_on: row.get(8),
        modified_on: row.get(9),
    })
}

fn normalize_input(mut input: PageInput) -> Result<PageInput, AppError> {
    input.title = input.title.trim().to_string();
    input.subtitle = normalize_optional_text(input.subtitle);
    input.description = normalize_optional_text(input.description);

    if input.title.is_empty() {
        return Err(AppError::BadRequest("page title is required".into()));
    }

    let mut ids = BTreeSet::new();
    input.blocks = normalize_blocks(input.blocks, &mut ids)?;
    Ok(input)
}

fn normalize_blocks(
    blocks: Vec<PageBlock>,
    ids: &mut BTreeSet<String>,
) -> Result<Vec<PageBlock>, AppError> {
    let mut normalized = Vec::with_capacity(blocks.len());
    for block in blocks {
        normalized.push(normalize_block(block, ids)?);
    }
    Ok(normalized)
}

fn normalize_block(block: PageBlock, ids: &mut BTreeSet<String>) -> Result<PageBlock, AppError> {
    match block {
        PageBlock::Section {
            id,
            mut props,
            children,
        } => {
            let id = normalize_id(id, ids)?;
            props.title = normalize_optional_text(props.title);
            props.subtitle = normalize_optional_text(props.subtitle);
            props.description = normalize_optional_text(props.description);
            props.eyebrow = normalize_optional_text(props.eyebrow);
            props.background_type = normalize_optional_text(props.background_type);
            props.background_value = normalize_optional_text(props.background_value);
            props.overlay_color = normalize_optional_text(props.overlay_color);
            props.text_color = normalize_optional_text(props.text_color);
            props.media_url = normalize_optional_text(props.media_url);
            props.media_kind = normalize_optional_text(props.media_kind);
            props.primary_button_label = normalize_optional_text(props.primary_button_label);
            props.primary_button_href = normalize_optional_text(props.primary_button_href);
            props.secondary_button_label = normalize_optional_text(props.secondary_button_label);
            props.secondary_button_href = normalize_optional_text(props.secondary_button_href);
            let children = normalize_blocks(children, ids)?;
            Ok(PageBlock::Section {
                id,
                props,
                children,
            })
        }
        PageBlock::Container {
            id,
            mut props,
            children,
        } => {
            let id = normalize_id(id, ids)?;
            props.layout = normalize_optional_text(props.layout);
            props.gap = normalize_optional_text(props.gap);
            let children = normalize_blocks(children, ids)?;
            Ok(PageBlock::Container {
                id,
                props,
                children,
            })
        }
        PageBlock::Heading { id, mut props } => {
            let id = normalize_id(id, ids)?;
            props.text = props.text.trim().to_string();
            props.align = normalize_optional_text(props.align);
            if props.text.is_empty() {
                return Err(AppError::BadRequest("heading text is required".into()));
            }
            if let Some(level) = props.level {
                if !(1..=3).contains(&level) {
                    return Err(AppError::BadRequest(
                        "heading level must be between 1 and 3".into(),
                    ));
                }
            }
            Ok(PageBlock::Heading { id, props })
        }
        PageBlock::Paragraph { id, mut props } => {
            let id = normalize_id(id, ids)?;
            props.text = props.text.trim().to_string();
            props.align = normalize_optional_text(props.align);
            if props.text.is_empty() {
                return Err(AppError::BadRequest("paragraph text is required".into()));
            }
            Ok(PageBlock::Paragraph { id, props })
        }
        PageBlock::Image { id, mut props } => {
            let id = normalize_id(id, ids)?;
            props.src = normalize_url(&props.src, "image src")?;
            props.alt = props.alt.trim().to_string();
            props.caption = normalize_optional_text(props.caption);
            if props.alt.is_empty() {
                return Err(AppError::BadRequest("image alt text is required".into()));
            }
            Ok(PageBlock::Image { id, props })
        }
        PageBlock::Button { id, mut props } => {
            let id = normalize_id(id, ids)?;
            props.label = props.label.trim().to_string();
            props.href = normalize_url(&props.href, "button href")?;
            props.variant = normalize_optional_text(props.variant);
            if props.label.is_empty() {
                return Err(AppError::BadRequest("button label is required".into()));
            }
            Ok(PageBlock::Button { id, props })
        }
        PageBlock::Divider { id, mut props } => {
            let id = normalize_id(id, ids)?;
            props.style = normalize_optional_text(props.style);
            Ok(PageBlock::Divider { id, props })
        }
        PageBlock::Spacer { id, props } => {
            let id = normalize_id(id, ids)?;
            if props.height < 0 {
                return Err(AppError::BadRequest(
                    "spacer height must be greater than or equal to zero".into(),
                ));
            }
            if props.height > 1024 {
                return Err(AppError::BadRequest("spacer height is too large".into()));
            }
            Ok(PageBlock::Spacer { id, props })
        }
    }
}

fn normalize_id(id: String, ids: &mut BTreeSet<String>) -> Result<String, AppError> {
    let normalized = id.trim().to_string();
    if normalized.is_empty() {
        return Err(AppError::BadRequest("block id is required".into()));
    }
    if !ids.insert(normalized.clone()) {
        return Err(AppError::BadRequest("block ids must be unique".into()));
    }
    Ok(normalized)
}

fn normalize_optional_text(value: Option<String>) -> Option<String> {
    value
        .map(|text| text.trim().to_string())
        .filter(|text| !text.is_empty())
}

fn normalize_url(value: &str, field_name: &str) -> Result<String, AppError> {
    let url = value.trim();
    if url.is_empty() {
        return Err(AppError::BadRequest(format!("{field_name} is required")));
    }

    if url.starts_with('#')
        || url.starts_with('/')
        || url.starts_with("http://")
        || url.starts_with("https://")
    {
        Ok(url.to_string())
    } else {
        Err(AppError::BadRequest(format!(
            "{field_name} must use http, https, or a relative path"
        )))
    }
}

fn default_page(published: bool) -> PageDocument {
    let page = default_input();
    PageDocument {
        id: "default-home".to_string(),
        slug: PAGE_SLUG.to_string(),
        title: page.title,
        subtitle: page.subtitle,
        description: page.description,
        blocks: page.blocks,
        is_published: published,
        published_on: None,
        created_on: "1970-01-01T00:00:00Z".to_string(),
        modified_on: "1970-01-01T00:00:00Z".to_string(),
    }
}

fn default_input() -> PageInput {
    PageInput {
        title: "Tea Time".to_string(),
        subtitle: Some("Refreshment that moves with your workday".to_string()),
        description: Some(
            "A structured homepage page that combines a hero section, simple content blocks, and editor-managed media.".to_string(),
        ),
        blocks: vec![
            PageBlock::Section {
                id: "hero-section".to_string(),
                props: SectionBlockProps {
                    title: Some("Tea Time".to_string()),
                    subtitle: Some("Refreshment that moves with your workday".to_string()),
                    description: Some(
                        "Daily delivery of hot and cold beverages, snacks, and subscription refreshment support.".to_string(),
                    ),
                    eyebrow: Some("Homepage".to_string()),
                    background_type: Some("gradient".to_string()),
                    background_value: Some("linear-gradient(135deg, #375c36 0%, #7d8f49 42%, #283b24 100%)".to_string()),
                    overlay_color: Some("rgba(17, 24, 18, 0.24)".to_string()),
                    text_color: Some("#ffffff".to_string()),
                    media_url: None,
                    media_kind: None,
                    primary_button_label: Some("Subscribe now".to_string()),
                    primary_button_href: Some("#account".to_string()),
                    secondary_button_label: Some("Browse products".to_string()),
                    secondary_button_href: Some("#products".to_string()),
                },
                children: vec![
                    PageBlock::Heading {
                        id: "hero-heading".to_string(),
                        props: HeadingBlockProps {
                            text: "A structured homepage editor, not a freeform canvas.".to_string(),
                            level: Some(1),
                            align: Some("left".to_string()),
                        },
                    },
                    PageBlock::Paragraph {
                        id: "hero-copy".to_string(),
                        props: ParagraphBlockProps {
                            text: "Use blocks to shape the homepage, preview it across devices, and publish the exact content customers see.".to_string(),
                            align: Some("left".to_string()),
                        },
                    },
                ],
            },
        ],
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn base_input() -> PageInput {
        PageInput {
            title: "Homepage".to_string(),
            subtitle: Some("Welcome".to_string()),
            description: Some("Intro text".to_string()),
            blocks: vec![PageBlock::Heading {
                id: "heading-1".to_string(),
                props: HeadingBlockProps {
                    text: "Hello world".to_string(),
                    level: Some(1),
                    align: None,
                },
            }],
        }
    }

    #[test]
    fn normalizes_text_fields() {
        let mut input = base_input();
        input.title = "  Homepage  ".to_string();
        input.subtitle = Some("  ".to_string());
        input.description = Some("  Welcome to the site  ".to_string());

        let normalized = normalize_input(input).expect("input should normalize");
        assert_eq!(normalized.title, "Homepage");
        assert_eq!(normalized.subtitle, None);
        assert_eq!(
            normalized.description,
            Some("Welcome to the site".to_string())
        );
    }

    #[test]
    fn rejects_duplicate_block_ids() {
        let mut input = base_input();
        input.blocks.push(PageBlock::Paragraph {
            id: "heading-1".to_string(),
            props: ParagraphBlockProps {
                text: "Duplicate".to_string(),
                align: None,
            },
        });

        let error = normalize_input(input).unwrap_err();
        assert!(error.to_string().contains("unique"));
    }

    #[test]
    fn rejects_unsafe_urls() {
        let mut input = base_input();
        input.blocks = vec![PageBlock::Button {
            id: "button-1".to_string(),
            props: ButtonBlockProps {
                label: "Click".to_string(),
                href: "javascript:alert(1)".to_string(),
                variant: None,
            },
        }];

        let error = normalize_input(input).unwrap_err();
        assert!(error.to_string().contains("button href"));
    }
}
