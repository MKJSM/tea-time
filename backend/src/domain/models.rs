use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use validator::Validate;

#[derive(Serialize, Deserialize, FromRow, Clone, Debug)]
pub struct Product {
    pub id: String, // UUID
    pub name: String,
    pub description: Option<String>,
    pub base_price: f64,
    pub category: sqlx::types::Json<Vec<String>>,
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
    pub id: String, // UUID
    pub name: String,
    pub description: Option<String>,
    pub input_type: String,
    pub min_selections: i32,
    pub max_selections: Option<i32>,
    pub is_required: bool,
}

#[derive(Serialize, Deserialize, FromRow, Clone, Debug)]
pub struct CustomizationOption {
    pub id: String,       // UUID
    pub group_id: String, // UUID
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
    pub last_login_at: Option<DateTime<Utc>>,
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



#[derive(Deserialize)]

pub struct LogoutDeviceRequest {


    pub session_id: String,
}

// Address Models
#[derive(Serialize, Deserialize, FromRow, Clone, Debug)]
pub struct Address {
    pub id: String, // UUID
    pub user_id: String,
    pub label: String, // "Home", "Work", "Other"
    pub recipient_name: String,
    pub phone_number: String,
    pub street_address: String,
    pub city: String,
    pub state: String,
    pub postal_code: String,
    pub latitude: Option<f64>,
    pub longitude: Option<f64>,
    pub is_default: bool,
    pub created_at: Option<DateTime<Utc>>,
}

#[derive(Serialize, Deserialize, Validate, Debug)]
pub struct CreateAddressRequest {
    #[validate(length(min = 1, max = 50, message = "Label must be between 1 and 50 characters"))]
    pub label: String,
    #[validate(length(min = 1, max = 100, message = "Recipient name is required"))]
    pub recipient_name: String,
    #[validate(length(min = 10, max = 15, message = "Phone number must be 10-15 characters"))]
    pub phone_number: String,
    #[validate(length(min = 1, max = 255, message = "Street address is required"))]
    pub street_address: String,
    #[validate(length(min = 1, max = 100, message = "City is required"))]
    pub city: String,
    #[validate(length(min = 1, max = 100, message = "State is required"))]
    pub state: String,
    #[validate(length(min = 5, max = 10, message = "Postal code must be 5-10 characters"))]
    pub postal_code: String,
    pub latitude: Option<f64>,
    pub longitude: Option<f64>,
    #[serde(default)]
    pub is_default: bool,
}

#[derive(Serialize, Deserialize, Validate, Debug)]
pub struct UpdateAddressRequest {
    pub label: Option<String>,
    pub recipient_name: Option<String>,
    pub phone_number: Option<String>,
    pub street_address: Option<String>,
    pub city: Option<String>,
    pub state: Option<String>,
    pub postal_code: Option<String>,
    pub latitude: Option<f64>,
    pub longitude: Option<f64>,
    pub is_default: Option<bool>,
}
