use axum::{extract::{State, Path, Query}, Json};
use serde::{Serialize, Deserialize};
use crate::domain::models::{Product, CustomizationGroup, CustomizationOption, ProductCustomization};
use crate::state::AppState;
use crate::error::AppError;
use std::collections::HashMap;

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
    pub id: String,
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
    pub id: String,
    pub name: String,
    pub type_: String,
    pub required: bool,
    pub help_text: Option<String>,
    pub options: Vec<AttributeOptionResponse>,
}


#[derive(Serialize, Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct ProductResponse {
    pub id: String,
    pub name: String,
    pub description: Option<String>,
    pub price: f64,
    pub category: String,
    pub image: String,
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
    pub attributes: Vec<ProductAttributeResponse>,
    
    pub story: Option<String>,
    pub tags: Vec<String>,
}

#[derive(Deserialize)]
pub struct ProductQuery {
    pub page: Option<i64>,
    pub limit: Option<i64>,
    pub q: Option<String>,
    pub category: Option<String>,
}

// Helper struct for query results
#[derive(sqlx::FromRow)] 
struct ProductGroupRow {
    product_id: i32,
    id: i32, // group id
    name: String,
    description: Option<String>,
    input_type: String,
    is_required: bool,
}

// Helper struct for shared logic (fetching attributes for a list of product IDs)
// In a real app, this would be refactored into a service/repository layer
async fn fetch_attributes_for_products(
    db: &sqlx::SqlitePool,
    product_ids: &[i32],
) -> Result<HashMap<i32, Vec<ProductAttributeResponse>>, AppError> { // Map<ProductId, List<Attr>>
    if product_ids.is_empty() {
        return Ok(HashMap::new());
    }

    // Dynamic query for IN clause is tricky in sqlx without macros or query builder
    // For simplicity, we just fetch all customizations if list is large, or filtered if small.
    // Given the current setup, let's just fetch all linked to these products.
    
    // Building the query string manually for the IN clause
    let placeholders: Vec<String> = product_ids.iter().map(|_| "?".to_string()).collect();
    let query_groups = format!(
        r#"
        SELECT pc.product_id, cg.id, cg.name, cg.description, cg.input_type, cg.is_required
        FROM product_customizations pc
        JOIN customization_groups cg ON pc.group_id = cg.id
        WHERE pc.product_id IN ({})
        ORDER BY pc.product_id, pc.display_order
        "#,
        placeholders.join(",")
    );

    let mut query = sqlx::query_as::<_, ProductGroupRow>(&query_groups);
    for id in product_ids {
        query = query.bind(id);
    }
    let product_groups = query.fetch_all(db).await?;

    if product_groups.is_empty() {
        return Ok(HashMap::new());
    }

    // Now fetch options for the groups found
    let group_ids: Vec<i32> = product_groups.iter().map(|g| g.id).collect();
    // Dedup
    let mut unique_group_ids = group_ids.clone();
    unique_group_ids.sort();
    unique_group_ids.dedup();

    let placeholders_opts: Vec<String> = unique_group_ids.iter().map(|_| "?".to_string()).collect();
    let query_opts = format!(
        "SELECT * FROM customization_options WHERE group_id IN ({}) ORDER BY group_id, display_order",
        placeholders_opts.join(",")
    );
    
    let mut query_o = sqlx::query_as::<_, CustomizationOption>(&query_opts);
    for id in &unique_group_ids {
        query_o = query_o.bind(id);
    }
    let all_options = query_o.fetch_all(db).await?;

    // Processing
    let mut options_by_group: HashMap<i32, Vec<CustomizationOption>> = HashMap::new();
    for opt in all_options {
        options_by_group.entry(opt.group_id).or_default().push(opt);
    }

    let mut groups_by_product: HashMap<i32, Vec<ProductGroupRow>> = HashMap::new();
    for pg in product_groups {
        groups_by_product.entry(pg.product_id).or_default().push(pg);
    }

    let mut result = HashMap::new();

    for product_id in product_ids {
        let mut attributes = Vec::new();
        if let Some(groups) = groups_by_product.get(product_id) {
             for group in groups {
                let options = options_by_group.get(&group.id).map(|opts| {
                    opts.iter().map(|o| AttributeOptionResponse {
                        id: o.id.to_string(),
                        value: o.name.clone(),
                        display_name: o.name.clone(),
                        price_adjustment: o.price_modifier,
                        in_stock: true,
                        default: o.is_default,
                        color_code: o.color_code.clone(),
                    }).collect()
                }).unwrap_or_default();

                attributes.push(ProductAttributeResponse {
                    id: group.id.to_string(),
                    name: group.name.clone(),
                    type_: if group.input_type == "radio" { "select".to_string() } else { group.input_type.clone() },
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
    let flavor_profile: FlavorProfile = p.flavor_profile
        .as_ref()
        .and_then(|json| serde_json::from_str(json).ok())
        .unwrap_or_default();

    let brewing: BrewingInstructions = p.brewing_guide
        .as_ref()
        .and_then(|json| serde_json::from_str(json).ok())
        .unwrap_or_default();

    let tags: Vec<String> = p.tags
        .as_ref()
        .and_then(|json| serde_json::from_str(json).ok())
        .unwrap_or_default();

    ProductResponse {
        id: p.id.to_string(),
        name: p.name,
        description: p.description,
        price: p.base_price,
        category: p.category,
        image: p.image_url.unwrap_or_default(),
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
        story: p.story.or(Some("".to_string())),
        tags,
    }
}


pub async fn get_products(
    State(state): State<AppState>,
    Query(query): Query<ProductQuery>,
) -> Result<Json<Vec<ProductResponse>>, AppError> {
    // Note: building a dynamic query with `sqlx` and `bind` correctly requires `QueryBuilder`
    // or careful manual construction. For simplicity in this demo, we'll build the string
    // and bind parameters sequentially.

    let mut query_builder = sqlx::QueryBuilder::new("SELECT * FROM products WHERE is_active = 1");

    if let Some(ref q) = query.q {
        if !q.trim().is_empty() {
            let search = format!("%{}%", q.trim().to_lowercase());
            query_builder.push(" AND (LOWER(name) LIKE ");
            query_builder.push_bind(search.clone());
            query_builder.push(" OR LOWER(origin) LIKE ");
            query_builder.push_bind(search.clone()); // Bind the same search string again
            query_builder.push(" OR LOWER(category) LIKE ");
            query_builder.push_bind(search);
            query_builder.push(")");
        }
    }

    if let Some(ref cat) = query.category {
        if cat != "All" {
            query_builder.push(" AND category = ");
            query_builder.push_bind(cat);
        }
    }

    // Pagination
    let page = query.page.unwrap_or(1).max(1);
    let limit = query.limit.unwrap_or(12).max(1);
    let offset = (page - 1) * limit;

    query_builder.push(" LIMIT ");
    query_builder.push_bind(limit);
    query_builder.push(" OFFSET ");
    query_builder.push_bind(offset);

    let products = query_builder.build_query_as::<Product>()
        .fetch_all(&state.db)
        .await?;

    // Fetch attributes
    let product_ids: Vec<i32> = products.iter().map(|p| p.id).collect();
    let attributes_map = fetch_attributes_for_products(&state.db, &product_ids).await?;

    let response = products.into_iter().map(|p| {
        let attributes = attributes_map.get(&p.id).cloned().unwrap_or_default();
        map_to_response(p, attributes)
    }).collect();

    Ok(Json(response))
}

pub async fn get_product_by_id(
    State(state): State<AppState>,
    Path(id): Path<i32>, // Using i32 directly as we know it's numeric in DB, axum will parse
) -> Result<Json<ProductResponse>, AppError> {
    let product = sqlx::query_as::<_, Product>(
        "SELECT * FROM products WHERE id = ?"
    )
    .bind(id)
    .fetch_optional(&state.db)
    .await?
    .ok_or_else(|| AppError::NotFound("Product not found".into()))?;

    let attributes_map = fetch_attributes_for_products(&state.db, &[product.id]).await?;
    let attributes = attributes_map.get(&product.id).cloned().unwrap_or_default();

    Ok(Json(map_to_response(product, attributes)))
}


pub async fn get_product_customizations(
    State(state): State<AppState>,
    Path(product_id): Path<i32>,
) -> Result<Json<Vec<ProductCustomization>>, AppError> {
    let groups = sqlx::query_as::<_, CustomizationGroup>(
        r#"
        SELECT cg.* 
        FROM customization_groups cg
        JOIN product_customizations pc ON cg.id = pc.group_id
        WHERE pc.product_id = ?
        ORDER BY pc.display_order
        "#
    )
    .bind(product_id)
    .fetch_all(&state.db)
    .await?;

    let mut result = Vec::new();

    for group in groups {
        let options = sqlx::query_as::<_, CustomizationOption>(
            "SELECT * FROM customization_options WHERE group_id = ? ORDER BY display_order"
        )
        .bind(group.id)
        .fetch_all(&state.db)
        .await?;

        result.push(ProductCustomization {
            group,
            options,
        });
    }

    Ok(Json(result))
}

#[cfg(test)]
mod tests {
    // ... tests ...
}
