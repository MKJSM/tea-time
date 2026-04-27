use std::collections::{BTreeMap, BTreeSet};

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
    pub rating: f64,
    pub origin: Option<String>,
    pub caffeine: Option<String>,
    pub format: Option<String>,
    pub story: Option<String>,
    pub tags: Vec<String>,
    pub flavor_profile: Vec<String>,
    pub brewing_guide: Vec<String>,
    pub created_on: DateTime<Utc>,
    pub modified_on: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CategoryProduct {
    pub category_id: Uuid,
    pub product_id: Uuid,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CustomizationOption {
    pub id: String,
    pub name: String,
    pub description: Option<String>,
    pub price_delta: f64,
    pub sort_order: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CustomizationGroup {
    pub id: String,
    pub name: String,
    pub description: Option<String>,
    pub min_select: i32,
    pub max_select: i32,
    pub sort_order: i32,
    pub options: Vec<CustomizationOption>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CustomizationGroupInput {
    pub name: String,
    pub description: Option<String>,
    pub min_select: i32,
    pub max_select: i32,
    pub sort_order: i32,
    pub options: Vec<CustomizationOptionInput>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CustomizationOptionInput {
    pub name: String,
    pub description: Option<String>,
    pub price_delta: f64,
    pub sort_order: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProductListItem {
    pub id: String,
    pub name: String,
    pub images: Vec<String>,
    pub price: f64,
    pub description: Option<String>,
    pub rating: f64,
    pub origin: Option<String>,
    pub caffeine: Option<String>,
    pub format: Option<String>,
    pub tags: Vec<String>,
    pub flavor_profile: Vec<String>,
    pub category_ids: Vec<String>,
    pub categories: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProductDetail {
    pub id: String,
    pub name: String,
    pub images: Vec<String>,
    pub price: f64,
    pub description: Option<String>,
    pub rating: f64,
    pub origin: Option<String>,
    pub caffeine: Option<String>,
    pub format: Option<String>,
    pub story: Option<String>,
    pub tags: Vec<String>,
    pub flavor_profile: Vec<String>,
    pub brewing_guide: Vec<String>,
    pub category_ids: Vec<String>,
    pub categories: Vec<String>,
    pub customization_groups: Vec<CustomizationGroup>,
}

#[derive(Debug, Clone, Deserialize)]
pub struct ProductInput {
    pub name: String,
    pub images: Vec<String>,
    pub price: f64,
    pub description: Option<String>,
    pub rating: f64,
    pub origin: Option<String>,
    pub caffeine: Option<String>,
    pub format: Option<String>,
    pub story: Option<String>,
    pub tags: Vec<String>,
    pub flavor_profile: Vec<String>,
    pub brewing_guide: Vec<String>,
    pub category_ids: Vec<String>,
    pub customization_groups: Vec<CustomizationGroupInput>,
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
                    p.rating,
                    p.origin,
                    p.caffeine,
                    p.format,
                    p.tags,
                    p.flavor_profile,
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
                GROUP BY
                    p.id, p.name, p.images, p.price, p.description, p.rating, p.origin, p.caffeine, p.format,
                    p.tags, p.flavor_profile, p.created_on
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
                    p.rating,
                    p.origin,
                    p.caffeine,
                    p.format,
                    p.tags,
                    p.flavor_profile,
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
                GROUP BY
                    p.id, p.name, p.images, p.price, p.description, p.rating, p.origin, p.caffeine, p.format,
                    p.tags, p.flavor_profile, p.created_on
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

pub async fn create(pool: &Pool, input: ProductInput) -> Result<ProductDetail, AppError> {
    let input = normalize_input(input)?;
    let mut client = pool.get().await.map_err(map_pool_error_to_app_error)?;
    let tx = client.transaction().await?;
    let product_id = Uuid::new_v4().to_string();

    tx.execute(
        r#"
        INSERT INTO product
            (id, name, images, price, description, rating, origin, caffeine, format, story, tags, flavor_profile, brewing_guide)
        VALUES
            ($1::text::uuid, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        "#,
        &[
            &product_id,
            &input.name,
            &input.images,
            &input.price,
            &input.description,
            &input.rating,
            &input.origin,
            &input.caffeine,
            &input.format,
            &input.story,
            &input.tags,
            &input.flavor_profile,
            &input.brewing_guide,
        ],
    )
    .await?;

    sync_categories(&tx, &product_id, &input.category_ids).await?;
    sync_customization_groups(&tx, &product_id, &input.customization_groups).await?;
    tx.commit().await?;
    get(pool, &product_id).await
}

pub async fn update(
    pool: &Pool,
    product_id: &str,
    input: ProductInput,
) -> Result<ProductDetail, AppError> {
    let input = normalize_input(input)?;
    let mut client = pool.get().await.map_err(map_pool_error_to_app_error)?;
    let tx = client.transaction().await?;
    let updated = tx
        .execute(
            r#"
            UPDATE product
            SET
                name = $2,
                images = $3,
                price = $4,
                description = $5,
                rating = $6,
                origin = $7,
                caffeine = $8,
                format = $9,
                story = $10,
                tags = $11,
                flavor_profile = $12,
                brewing_guide = $13,
                modified_on = NOW()
            WHERE id = $1::text::uuid
            "#,
            &[
                &product_id,
                &input.name,
                &input.images,
                &input.price,
                &input.description,
                &input.rating,
                &input.origin,
                &input.caffeine,
                &input.format,
                &input.story,
                &input.tags,
                &input.flavor_profile,
                &input.brewing_guide,
            ],
        )
        .await?;
    if updated == 0 {
        return Err(AppError::NotFound("product not found".into()));
    }

    tx.execute(
        "DELETE FROM category_product WHERE product_id = $1::text::uuid",
        &[&product_id],
    )
    .await?;
    tx.execute(
        "DELETE FROM product_customization_group WHERE product_id = $1::text::uuid",
        &[&product_id],
    )
    .await?;
    sync_categories(&tx, product_id, &input.category_ids).await?;
    sync_customization_groups(&tx, product_id, &input.customization_groups).await?;
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

pub async fn get(pool: &Pool, product_id: &str) -> Result<ProductDetail, AppError> {
    let client = pool.get().await.map_err(map_pool_error_to_app_error)?;
    let product_row = client
        .query_opt(
            r#"
            SELECT
                p.id::text,
                p.name,
                p.images,
                p.price,
                p.description,
                p.rating,
                p.origin,
                p.caffeine,
                p.format,
                p.story,
                p.tags,
                p.flavor_profile,
                p.brewing_guide,
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
            WHERE p.id = $1::text::uuid
            GROUP BY
                p.id, p.name, p.images, p.price, p.description, p.rating, p.origin, p.caffeine, p.format,
                p.story, p.tags, p.flavor_profile, p.brewing_guide
            "#,
            &[&product_id],
        )
        .await?;
    let product_row = product_row
        .ok_or_else(|| AppError::NotFound("product not found".into()))?;
    let customization_groups = load_customization_groups(&client, product_id).await?;
    Ok(ProductDetail {
        id: product_row.get(0),
        name: product_row.get(1),
        images: product_row.get(2),
        price: product_row.get(3),
        description: product_row.get(4),
        rating: product_row.get(5),
        origin: product_row.get(6),
        caffeine: product_row.get(7),
        format: product_row.get(8),
        story: product_row.get(9),
        tags: product_row.get(10),
        flavor_profile: product_row.get(11),
        brewing_guide: product_row.get(12),
        category_ids: product_row.get(13),
        categories: product_row.get(14),
        customization_groups,
    })
}

fn map_product_row(row: &Row) -> ProductListItem {
    ProductListItem {
        id: row.get(0),
        name: row.get(1),
        images: row.get(2),
        price: row.get(3),
        description: row.get(4),
        rating: row.get(5),
        origin: row.get(6),
        caffeine: row.get(7),
        format: row.get(8),
        tags: row.get(9),
        flavor_profile: row.get(10),
        category_ids: row.get(11),
        categories: row.get(12),
    }
}

async fn load_customization_groups(
    client: &deadpool_postgres::Client,
    product_id: &str,
) -> Result<Vec<CustomizationGroup>, AppError> {
    let rows = client
        .query(
            r#"
            SELECT
                g.id::text,
                g.name,
                g.description,
                g.min_select,
                g.max_select,
                g.sort_order,
                o.id::text,
                o.name,
                o.description,
                o.price_delta,
                o.sort_order
            FROM product_customization_group g
            LEFT JOIN product_customization_option o ON o.group_id = g.id
            WHERE g.product_id = $1::text::uuid
            ORDER BY g.sort_order ASC, o.sort_order ASC, o.created_on ASC
            "#,
            &[&product_id],
        )
        .await?;

    let mut groups_by_id: BTreeMap<String, CustomizationGroup> = BTreeMap::new();
    for row in rows {
        let group_id: String = row.get(0);
        let entry = groups_by_id
            .entry(group_id.clone())
            .or_insert_with(|| CustomizationGroup {
                id: group_id.clone(),
                name: row.get(1),
                description: row.get(2),
                min_select: row.get(3),
                max_select: row.get(4),
                sort_order: row.get(5),
                options: Vec::new(),
            });

        let option_id: Option<String> = row.get(6);
        if let Some(option_id) = option_id {
            entry.options.push(CustomizationOption {
                id: option_id,
                name: row.get(7),
                description: row.get(8),
                price_delta: row.get(9),
                sort_order: row.get(10),
            });
        }
    }

    let mut groups = groups_by_id.into_values().collect::<Vec<_>>();
    groups.sort_by_key(|group| group.sort_order);
    Ok(groups)
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

async fn sync_customization_groups(
    tx: &deadpool_postgres::Transaction<'_>,
    product_id: &str,
    groups: &[CustomizationGroupInput],
) -> Result<(), AppError> {
    for group in groups {
        let group_id = Uuid::new_v4().to_string();
        tx.execute(
            r#"
            INSERT INTO product_customization_group
                (id, product_id, name, description, min_select, max_select, sort_order)
            VALUES
                ($1::text::uuid, $2::text::uuid, $3, $4, $5, $6, $7)
            "#,
            &[
                &group_id,
                &product_id,
                &group.name,
                &group.description,
                &group.min_select,
                &group.max_select,
                &group.sort_order,
            ],
        )
        .await?;

        for option in &group.options {
            tx.execute(
                r#"
                INSERT INTO product_customization_option
                    (id, group_id, name, description, price_delta, sort_order)
                VALUES
                    ($1::text::uuid, $2::text::uuid, $3, $4, $5, $6)
                "#,
                &[
                    &Uuid::new_v4().to_string(),
                    &group_id,
                    &option.name,
                    &option.description,
                    &option.price_delta,
                    &option.sort_order,
                ],
            )
            .await?;
        }
    }
    Ok(())
}

fn normalize_input(mut input: ProductInput) -> Result<ProductInput, AppError> {
    input.name = input.name.trim().to_string();
    input.description = normalize_optional_text(input.description);
    input.origin = normalize_optional_text(input.origin);
    input.caffeine = normalize_optional_text(input.caffeine);
    input.format = normalize_optional_text(input.format);
    input.story = normalize_optional_text(input.story);
    input.tags = normalize_text_list(input.tags);
    input.flavor_profile = normalize_text_list(input.flavor_profile);
    input.brewing_guide = normalize_text_list(input.brewing_guide);
    input.images = normalize_text_list(input.images);
    input.category_ids = normalize_text_list(input.category_ids);
    input.customization_groups = input
        .customization_groups
        .into_iter()
        .map(normalize_group_input)
        .collect::<Result<Vec<_>, _>>()?;
    validate(&input)?;
    Ok(input)
}

fn normalize_group_input(mut input: CustomizationGroupInput) -> Result<CustomizationGroupInput, AppError> {
    input.name = input.name.trim().to_string();
    input.description = normalize_optional_text(input.description);
    input.options = input
        .options
        .into_iter()
        .map(normalize_option_input)
        .collect::<Result<Vec<_>, _>>()?;
    if input.name.is_empty() {
        return Err(AppError::BadRequest(
            "customization group name is required".into(),
        ));
    }
    if input.min_select < 0 || input.max_select < 0 || input.max_select < input.min_select {
        return Err(AppError::BadRequest(
            "customization group selection limits are invalid".into(),
        ));
    }
    if input.options.is_empty() {
        return Err(AppError::BadRequest(
            "customization group must include at least one option".into(),
        ));
    }
    Ok(input)
}

fn normalize_option_input(mut input: CustomizationOptionInput) -> Result<CustomizationOptionInput, AppError> {
    input.name = input.name.trim().to_string();
    input.description = normalize_optional_text(input.description);
    if input.name.is_empty() {
        return Err(AppError::BadRequest(
            "customization option name is required".into(),
        ));
    }
    Ok(input)
}

fn normalize_text_list(values: Vec<String>) -> Vec<String> {
    let mut seen = BTreeSet::new();
    values
        .into_iter()
        .map(|value| value.trim().to_string())
        .filter(|value| !value.is_empty())
        .filter(|value| seen.insert(value.clone()))
        .collect()
}

fn normalize_optional_text(value: Option<String>) -> Option<String> {
    value
        .map(|item| item.trim().to_string())
        .filter(|item| !item.is_empty())
}

fn validate(input: &ProductInput) -> Result<(), AppError> {
    if input.name.is_empty() {
        return Err(AppError::BadRequest("product name is required".into()));
    }
    if input.price <= 0.0 {
        return Err(AppError::BadRequest(
            "product price must be greater than zero".into(),
        ));
    }
    if !(0.0..=5.0).contains(&input.rating) {
        return Err(AppError::BadRequest(
            "product rating must be between 0 and 5".into(),
        ));
    }
    if input.images.is_empty() {
        return Err(AppError::BadRequest(
            "product must have at least one image".into(),
        ));
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    fn base_input() -> ProductInput {
        ProductInput {
            name: "Mountain Breakfast".into(),
            images: vec!["https://example.com/tea.jpg".into()],
            price: 420.0,
            description: Some("  A bold morning blend  ".into()),
            rating: 4.8,
            origin: Some("  Nilgiris  ".into()),
            caffeine: Some(" Medium ".into()),
            format: Some(" Loose leaf ".into()),
            story: Some("  Story text  ".into()),
            tags: vec![" morning ".into(), "tea".into(), "tea".into()],
            flavor_profile: vec![" malt ".into(), "honey".into()],
            brewing_guide: vec![" Steep for 3 minutes ".into()],
            category_ids: vec![" cat-1 ".into(), "".into()],
            customization_groups: vec![CustomizationGroupInput {
                name: " Strength ".into(),
                description: Some("  Adjust the body  ".into()),
                min_select: 0,
                max_select: 1,
                sort_order: 1,
                options: vec![
                    CustomizationOptionInput {
                        name: " Light ".into(),
                        description: None,
                        price_delta: 0.0,
                        sort_order: 1,
                    },
                    CustomizationOptionInput {
                        name: " Bold ".into(),
                        description: Some("  Stronger ".into()),
                        price_delta: 18.0,
                        sort_order: 2,
                    },
                ],
            }],
        }
    }

    #[test]
    fn normalizes_lists_and_text() {
        let input = normalize_input(base_input()).expect("input should normalize");
        assert_eq!(input.name, "Mountain Breakfast");
        assert_eq!(input.description.as_deref(), Some("A bold morning blend"));
        assert_eq!(input.origin.as_deref(), Some("Nilgiris"));
        assert_eq!(input.tags, vec!["morning".to_string(), "tea".to_string()]);
        assert_eq!(input.category_ids, vec!["cat-1".to_string()]);
        assert_eq!(input.customization_groups[0].name, "Strength");
        assert_eq!(input.customization_groups[0].options.len(), 2);
    }

    #[test]
    fn rejects_empty_name() {
        let mut input = base_input();
        input.name = "   ".into();

        let error = normalize_input(input).unwrap_err();
        assert!(error.to_string().contains("name"));
    }

    #[test]
    fn rejects_invalid_rating() {
        let mut input = base_input();
        input.rating = 6.0;

        let error = normalize_input(input).unwrap_err();
        assert!(error.to_string().contains("rating"));
    }
}
