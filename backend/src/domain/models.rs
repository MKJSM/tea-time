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
    
    // Rich Data Fields
    pub rating: f64,
    pub origin: Option<String>,
    pub caffeine: Option<String>,
    pub format: Option<String>,
    
    // Brewing
    pub brewing_guide: Option<String>,
    
    // Story/Marketing
    pub story: Option<String>,
    pub tags: Option<String>,
    
    // Flavor Profile
    pub flavor_profile: Option<String>,

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
    pub color_code: Option<String>,
}

#[derive(Serialize, Deserialize, Debug)]
// ... existing ProductCustomization ...
pub struct ProductCustomization {
    #[serde(flatten)]
    pub group: CustomizationGroup,
    pub options: Vec<CustomizationOption>,
}

#[derive(Serialize, Deserialize, FromRow, Clone, Debug)]
pub struct User {
    pub id: i32,
    pub name: String,
    pub email: String,
    pub phone: String,
    #[serde(skip_serializing)] // Never send password hash to client
    pub password_hash: String,
    pub role: String,
    pub created_at: Option<DateTime<Utc>>,
    pub updated_at: Option<DateTime<Utc>>,
}

#[derive(Serialize, Deserialize, FromRow, Clone, Debug)]
pub struct Session {
    pub id: String,
    pub user_id: i32,
    pub expires_at: DateTime<Utc>,
    pub created_at: Option<DateTime<Utc>>,
}

#[derive(Deserialize)]
pub struct CreateUserRequest {
    pub name: String,
    pub email: String,
    pub password: String,
    // phone is optional in current frontend modal, we can default it or ask for it
    pub phone: Option<String>, 
}

#[derive(Deserialize)]
pub struct LoginUserRequest {
    pub email: String,
    pub password: Option<String>, // Making optional to support "social" login simul (if needed later)
}

#[derive(Serialize)]
pub struct AuthResponse {
    pub user: User,
    pub token: String,
}
