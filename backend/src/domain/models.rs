use serde::{Serialize, Deserialize};
use sqlx::FromRow;
use chrono::{DateTime, Utc};

#[derive(Serialize, Deserialize, FromRow, Clone, Debug)]
pub struct Product {
    pub id: i32,
    pub name: String,
    pub description: Option<String>,
    pub base_price: f64,
    pub category: String,
    pub image_url: Option<String>,
    pub is_active: bool,
    pub sku: Option<String>,
    pub stock_quantity: i32,
    pub created_at: Option<DateTime<Utc>>,
    pub updated_at: Option<DateTime<Utc>>,
}

#[derive(Serialize, Deserialize, FromRow, Clone, Debug)]
pub struct CustomizationGroup {
    pub id: i32,
    pub name: String,
    pub description: Option<String>,
    pub input_type: String,
    pub min_selections: i32,
    pub max_selections: Option<i32>,
    pub is_required: bool,
}

#[derive(Serialize, Deserialize, FromRow, Clone, Debug)]
pub struct CustomizationOption {
    pub id: i32,
    pub group_id: i32,
    pub name: String,
    pub price_modifier: f64,
    pub is_default: bool,
    pub display_order: i32,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct ProductCustomization {
    #[serde(flatten)]
    pub group: CustomizationGroup,
    pub options: Vec<CustomizationOption>,
}
