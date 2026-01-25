use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use validator::Validate;

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
    pub id: String, // UUID
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
    pub user_id: String, // UUID
    pub expires_at: DateTime<Utc>,
    pub created_at: Option<DateTime<Utc>>,
}

#[derive(Serialize, Deserialize, Validate)]
pub struct CreateUserRequest {
    #[validate(length(
        min = 1,
        max = 100,
        message = "Name must be between 1 and 100 characters"
    ))]
    pub name: String,
    #[validate(email(message = "Invalid email format"))]
    pub email: String,
    #[validate(length(
        min = 8,
        max = 128,
        message = "Password must be between 8 and 128 characters"
    ))]
    pub password: String,
    #[validate(length(max = 20, message = "Phone must be at most 20 characters"))]
    pub phone: Option<String>,
}

#[derive(Serialize, Deserialize, Validate)]
pub struct LoginUserRequest {
    #[validate(email(message = "Invalid email format"))]
    pub email: String,
    #[validate(length(min = 1, message = "Password is required"))]
    pub password: String,
}

#[derive(Serialize)]
pub struct AuthResponse {
    pub user: User,
}

#[derive(Serialize, Deserialize, FromRow, Clone, Debug)]
pub struct Favorite {
    pub id: i32,
    pub user_id: String, // UUID
    pub product_id: i32,
    pub created_at: Option<DateTime<Utc>>,
}

#[derive(Deserialize)]
pub struct LogoutDeviceRequest {
    pub session_id: String,
}
