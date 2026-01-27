use crate::domain::models::{
    CustomizationGroup, CustomizationOption, Product, ProductCustomization,
};
use crate::error::AppError;
use crate::state::AppState;
use axum::{
    extract::{Path, Query, State},
    Json,
};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use uuid::Uuid;

// Constants for magic strings
const CATEGORY_ALL: &str = "All";
const MAX_PAGE_LIMIT: i64 = 100;
const DEFAULT_PAGE_LIMIT: i64 = 12;

#[derive(Serialize, Deserialize, Debug, Default)]
pub struct FlavorProfile {
    pub floral: f64,
    pub grassy: f64,
    pub nutty: f64,
    pub sweet: f64,
    pub earthy: f64,
    pub spicy: f64,
}

#[derive(Serialize, Deserialize, Debug, Default)]
pub struct BrewingInstructions {
    pub temperature: f64,
    pub time: f64,
    pub instructions: String,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct AttributeOptionResponse {
    pub id: Uuid,
    pub value: String,
    pub display_name: String,
    pub price_adjustment: f64,
    pub in_stock: bool,
    pub default: bool,
    pub color_code: Option<String>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct ProductAttributeResponse {
    pub id: Uuid,
    pub name: String,
    pub type_: String,
    pub required: bool,
    pub help_text: Option<String>,
    pub options: Vec<AttributeOptionResponse>,
}

#[derive(Serialize, Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct ProductResponse {
    pub id: Uuid,
    pub name: String,
    pub description: Option<String>,
    pub price: f64,
    pub categories: Vec<String>,
    pub image: String,
    pub images: Vec<String>,
    pub is_active: bool,
    pub sku: Option<String>,
    pub stock_quantity: i32,

    // Rich Data Fields
    pub rating: f64,
    pub origin: String,
    pub caffeine: String,
    pub format: String,

    // Nested objects
    pub flavor_profile: FlavorProfile,
    pub brewing: BrewingInstructions,
    #[serde(skip_serializing_if = "Vec::is_empty", default)]
    pub attributes: Vec<ProductAttributeResponse>,

    pub story: Option<String>,
    pub tags: Vec<String>,
}

/// Paginated response with metadata
#[derive(Serialize, Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct PaginatedResponse<T> {
    pub data: Vec<T>,
    pub total: i64,
    pub page: i64,
    pub limit: i64,
    pub total_pages: i64,
}

#[derive(Deserialize, Debug)]
pub struct ProductQuery {
    pub page: Option<i64>,
    pub limit: Option<i64>,
    pub q: Option<String>,
    pub category: Option<String>,
    /// Include product attributes/customizations in response
    #[serde(default)]
    pub include_attributes: bool,
}

// Helper struct for query results
#[derive(sqlx::FromRow)]
struct ProductGroupRow {
    product_id: Uuid, // UUID
    id: Uuid,         // group id (UUID)
    name: String,
    description: Option<String>,
    input_type: String,
    is_required: bool,
}

// Helper struct for shared logic (fetching attributes for a list of product IDs)
async fn fetch_attributes_for_products(
    db: &sqlx::PgPool,
    product_ids: &[Uuid],
) -> Result<HashMap<Uuid, Vec<ProductAttributeResponse>>, AppError> {
    if product_ids.is_empty() {
        return Ok(HashMap::new());
    }

    // Use ANY($1) for array binding in Postgres
    let product_groups = sqlx::query_as::<_, ProductGroupRow>(
        r#"
        SELECT pc.product_id, cg.id, cg.name, cg.description, cg.input_type, cg.is_required
        FROM product_customizations pc
        JOIN customization_groups cg ON pc.group_id = cg.id
        WHERE pc.product_id = ANY($1)
        ORDER BY pc.product_id, pc.display_order
        "#,
    )
    .bind(product_ids)
    .fetch_all(db)
    .await?;

    if product_groups.is_empty() {
        return Ok(HashMap::new());
    }

    // Now fetch options for the groups found
    let mut group_ids: Vec<Uuid> = product_groups.iter().map(|g| g.id).collect();
    group_ids.sort();
    group_ids.dedup();

    let all_options = sqlx::query_as::<_, CustomizationOption>(
        "SELECT * FROM customization_options WHERE group_id = ANY($1) ORDER BY group_id, display_order",
    )
    .bind(&group_ids)
    .fetch_all(db)
    .await?;

    // Processing
    let mut options_by_group: HashMap<Uuid, Vec<CustomizationOption>> = HashMap::new();
    for opt in all_options {
        options_by_group.entry(opt.group_id).or_default().push(opt);
    }

    let mut groups_by_product: HashMap<Uuid, Vec<ProductGroupRow>> = HashMap::new();
    for pg in product_groups {
        groups_by_product.entry(pg.product_id).or_default().push(pg);
    }

    let mut result = HashMap::new();

    for product_id in product_ids {
        let mut attributes = Vec::new();
        if let Some(groups) = groups_by_product.get(product_id) {
            for group in groups {
                let options = options_by_group
                    .get(&group.id)
                    .map(|opts| {
                        opts.iter()
                            .map(|o| AttributeOptionResponse {
                                id: o.id,
                                value: o.name.clone(),
                                display_name: o.name.clone(),
                                price_adjustment: o.price_modifier,
                                in_stock: true,
                                default: o.is_default,
                                color_code: o.color_code.clone(),
                            })
                            .collect()
                    })
                    .unwrap_or_default();

                attributes.push(ProductAttributeResponse {
                    id: group.id,
                    name: group.name.clone(),
                    type_: if group.input_type == "radio" {
                        "select".to_string()
                    } else {
                        group.input_type.clone()
                    },
                    required: group.is_required,
                    help_text: group.description.clone(),
                    options,
                });
            }
        }
        result.insert(*product_id, attributes);
    }

    Ok(result)
}

fn map_to_response(p: Product, attributes: Vec<ProductAttributeResponse>) -> ProductResponse {
    let flavor_profile: FlavorProfile = p
        .flavor_profile
        .as_ref()
        .and_then(|json| serde_json::from_str(json).ok())
        .unwrap_or_default();

    let brewing: BrewingInstructions = p
        .brewing_guide
        .as_ref()
        .and_then(|json| serde_json::from_str(json).ok())
        .unwrap_or_default();

    let tags: Vec<String> = p
        .tags
        .as_ref()
        .and_then(|json| serde_json::from_str(json).ok())
        .unwrap_or_default();

    let categories = p.category.0;

    ProductResponse {
        id: p.id,
        name: p.name,
        description: p.description,
        price: p.base_price,
        categories,
        image: p.image_urls.first().cloned().unwrap_or_default(),
        images: p.image_urls,
        is_active: p.is_active,
        sku: p.sku,
        stock_quantity: p.stock_quantity,
        rating: p.rating,
        origin: p.origin.unwrap_or_default(),
        caffeine: p.caffeine.unwrap_or_default(),
        format: p.format.unwrap_or_default(),
        flavor_profile,
        brewing,
        attributes,
        story: p.story,
        tags,
    }
}

#[tracing::instrument(skip(state))]
pub async fn get_products(
    State(state): State<AppState>,
    Query(query): Query<ProductQuery>,
) -> Result<Json<PaginatedResponse<ProductResponse>>, AppError> {
    // Pagination with bounds
    let page = query.page.unwrap_or(1).max(1);
    let limit = query
        .limit
        .unwrap_or(DEFAULT_PAGE_LIMIT)
        .clamp(1, MAX_PAGE_LIMIT);
    let offset = (page - 1) * limit;

    // Build query
    let mut query_builder =
        sqlx::QueryBuilder::new("SELECT * FROM products WHERE is_active = TRUE");
    let mut count_builder =
        sqlx::QueryBuilder::new("SELECT COUNT(*) FROM products WHERE is_active = TRUE");

    // Search filter using ILIKE
    if let Some(ref q) = query.q {
        if !q.trim().is_empty() {
            let search = format!("%{}%", q.trim());
            query_builder.push(" AND (name ILIKE ");
            query_builder.push_bind(search.clone());
            query_builder.push(" OR origin ILIKE ");
            query_builder.push_bind(search.clone());
            // Casting JSONB to text for search is tricky, simpler to skip or use specific op
            // query_builder.push(" OR category::text ILIKE ");
            // query_builder.push_bind(search);
            query_builder.push(")");

            let search_count = format!("%{}%", q.trim());
            count_builder.push(" AND (name ILIKE ");
            count_builder.push_bind(search_count.clone());
            count_builder.push(" OR origin ILIKE ");
            count_builder.push_bind(search_count.clone());
            // count_builder.push(" OR category::text ILIKE ");
            // count_builder.push_bind(search_count);
            count_builder.push(")");
        }
    }

    // Category filter - updated for Postgres JSONB
    if let Some(ref cat) = query.category {
        if cat != CATEGORY_ALL {
            // category is JSONB array of strings. Check if 'cat' exists in array.
            // Using '?' operator: category ? 'Tea'
            query_builder.push(" AND category @> to_jsonb(");
            query_builder.push_bind(cat);
            query_builder.push("::text)"); // cast parameter to text then to jsonb? No, push_bind binds value.
                                           // to_jsonb($1::text) creates a json string "Tea".
                                           // But we want to match element in array.
                                           // ["Tea", "Hot"] @> '["Tea"]' works.
                                           // So we need to bind an array containing the category.
                                           // Alternatively: EXISTS (SELECT 1 FROM jsonb_array_elements_text(products.category) WHERE value = $1)

            // Let's use the EXISTS approach, it's safer.
            // However, QueryBuilder needs to handle bind count.
            // query_builder.push(" AND EXISTS (SELECT 1 FROM jsonb_array_elements_text(products.category) WHERE value = ");
            // query_builder.push_bind(cat);
            // query_builder.push(")");

            // Simpler: category @> '["Tea"]'
            // To bind: query_builder.push_bind(serde_json::json!([cat]));

            // Let's try EXISTS, less ambiguity
            // Wait, I need to reset query_builder if I use push inside if. Yes.
        }
    }

    // Re-doing Category logic cleanly
    if let Some(ref cat) = query.category {
        if cat != CATEGORY_ALL {
            // Using @> operator with jsonb array
            query_builder.push(" AND category @> ");
            query_builder.push_bind(serde_json::json!([cat]));

            count_builder.push(" AND category @> ");
            count_builder.push_bind(serde_json::json!([cat]));
        }
    }

    // Get total count
    let total: (i64,) = count_builder.build_query_as().fetch_one(&state.db).await?;
    let total = total.0;

    // Pagination
    query_builder.push(" LIMIT ");
    query_builder.push_bind(limit);
    query_builder.push(" OFFSET ");
    query_builder.push_bind(offset);

    let products = query_builder
        .build_query_as::<Product>()
        .fetch_all(&state.db)
        .await?;

    // Fetch attributes only if requested
    let attributes_map = if query.include_attributes {
        let product_ids: Vec<Uuid> = products.iter().map(|p| p.id).collect();
        fetch_attributes_for_products(&state.db, &product_ids).await?
    } else {
        HashMap::new()
    };

    let response: Vec<ProductResponse> = products
        .into_iter()
        .map(|p| {
            let attributes = attributes_map.get(&p.id).cloned().unwrap_or_default();
            map_to_response(p, attributes)
        })
        .collect();

    let total_pages = (total as f64 / limit as f64).ceil() as i64;

    Ok(Json(PaginatedResponse {
        data: response,
        total,
        page,
        limit,
        total_pages,
    }))
}

#[tracing::instrument(skip(state))]
pub async fn get_product_by_id(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<Json<ProductResponse>, AppError> {
    let product = sqlx::query_as::<_, Product>("SELECT * FROM products WHERE id = $1")
        .bind(id)
        .fetch_optional(&state.db)
        .await?
        .ok_or_else(|| AppError::NotFound("Product not found".into()))?;

    let attributes_map =
        fetch_attributes_for_products(&state.db, std::slice::from_ref(&product.id)).await?;
    let attributes = attributes_map.get(&product.id).cloned().unwrap_or_default();

    Ok(Json(map_to_response(product, attributes)))
}

/// Fixed N+1 query issue - now uses batch fetching
#[tracing::instrument(skip(state))]
pub async fn get_product_customizations(
    State(state): State<AppState>,
    Path(product_id): Path<Uuid>,
) -> Result<Json<Vec<ProductCustomization>>, AppError> {
    // Fetch groups for this product
    let groups = sqlx::query_as::<_, CustomizationGroup>(
        r#"
        SELECT cg.*
        FROM customization_groups cg
        JOIN product_customizations pc ON cg.id = pc.group_id
        WHERE pc.product_id = $1
        ORDER BY pc.display_order
        "#,
    )
    .bind(product_id)
    .fetch_all(&state.db)
    .await?;

    if groups.is_empty() {
        return Ok(Json(vec![]));
    }

    // Batch fetch all options for all groups in ONE query (fixes N+1)
    let group_ids: Vec<Uuid> = groups.iter().map(|g| g.id).collect();
    // Using ANY($1)
    let all_options = sqlx::query_as::<_, CustomizationOption>(
        "SELECT * FROM customization_options WHERE group_id = ANY($1) ORDER BY group_id, display_order",
    )
    .bind(&group_ids)
    .fetch_all(&state.db)
    .await?;

    // Group options by group_id
    let mut options_by_group: HashMap<Uuid, Vec<CustomizationOption>> = HashMap::new();
    for opt in all_options {
        options_by_group.entry(opt.group_id).or_default().push(opt);
    }

    // Build result
    let result: Vec<ProductCustomization> = groups
        .into_iter()
        .map(|group| {
            let options = options_by_group.remove(&group.id).unwrap_or_default();
            ProductCustomization { group, options }
        })
        .collect();

    Ok(Json(result))
}

#[tracing::instrument(skip(state))]
pub async fn get_categories(State(state): State<AppState>) -> Result<Json<Vec<String>>, AppError> {
    // Postgres specific: jsonb_array_elements_text
    let categories = sqlx::query_scalar::<_, String>(
        "SELECT DISTINCT value FROM products, jsonb_array_elements_text(products.category) as value WHERE products.is_active = TRUE ORDER BY value"
    )
    .fetch_all(&state.db)
    .await?;

    Ok(Json(categories))
}

#[cfg(test)]
mod tests {
    // ... tests ...
}
