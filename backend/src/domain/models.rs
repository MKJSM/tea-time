use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;
use validator::Validate;

#[derive(Serialize, Deserialize, FromRow, Clone, Debug)]
pub struct Product {
    pub id: Uuid,
    pub name: String,
    pub description: Option<String>,
    pub base_price: f64,
    pub category: sqlx::types::Json<Vec<String>>,
    pub image_urls: Vec<String>,
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
    pub id: Uuid,
    pub name: String,
    pub description: Option<String>,
    pub input_type: String,
    pub min_selections: i32,
    pub max_selections: Option<i32>,
    pub is_required: bool,
}

#[derive(Serialize, Deserialize, FromRow, Clone, Debug)]
pub struct CustomizationOption {
    pub id: Uuid,
    pub group_id: Uuid,
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
    pub id: Uuid,
    pub name: String,
    pub email: String,
    pub phone: String,
    #[serde(skip_serializing, default)] // Never send password hash to client
    pub password_hash: String,
    pub role: String,
    pub image_url: Option<String>,
    pub theme: String,
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

#[derive(Serialize, Deserialize)]
pub struct AuthResponse {
    pub user: User,
}

#[derive(Deserialize)]
pub struct LogoutDeviceRequest {
    pub session_id: String,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct DeviceResponse {
    pub session_id: String,
    pub ip_address: Option<String>,
    pub user_agent: Option<String>,
    pub last_active_at: Option<DateTime<Utc>>,
    pub is_current: bool,
}

// Address Models
#[derive(Serialize, Deserialize, FromRow, Clone, Debug)]
pub struct Address {
    pub id: Uuid,
    pub user_id: Uuid,
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
    #[validate(length(
        min = 1,
        max = 50,
        message = "Label must be between 1 and 50 characters"
    ))]
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

// User Profile Models
#[derive(Serialize, Deserialize, Debug)]
pub struct AddressResponse {
    pub id: Uuid,
    pub label: String,
    pub text: String, // Full address formatted as: street_address, city, state postal_code
    pub is_default: bool,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct UserProfileResponse {
    pub name: String,
    pub email: String,
    pub phone: String,
    pub image_url: Option<String>,
    pub theme: String,
    pub addresses: Vec<AddressResponse>,
    pub active_orders_count: i32,
    pub wishlist_count: i32,
    pub is_deleted: bool,
}

/// Full user profile response with complete Address objects for profile page
#[derive(Serialize, Deserialize, Debug)]
pub struct UserProfileResponseFull {
    pub name: String,
    pub email: String,
    pub phone: String,
    pub image_url: Option<String>,
    pub theme: String,
    pub addresses: Vec<Address>,
    pub active_orders_count: i32,
    pub wishlist_count: i32,
    pub is_deleted: bool,
}

#[derive(Serialize, Deserialize, Validate, Debug)]
pub struct UpdateUserProfileRequest {
    #[validate(length(
        min = 1,
        max = 100,
        message = "Name must be between 1 and 100 characters"
    ))]
    pub name: Option<String>,
    #[validate(email(message = "Invalid email format"))]
    pub email: Option<String>,
    #[validate(length(max = 20, message = "Phone must be at most 20 characters"))]
    pub phone: Option<String>,
    #[validate(regex(
        path = "*crate::domain::models::IMAGE_URL_REGEX",
        message = "Invalid image URL. Must be a valid HTTPS URL"
    ))]
    pub image_url: Option<String>,
}

#[derive(Serialize, Deserialize, Validate, Debug)]
pub struct ChangePasswordRequest {
    #[validate(length(min = 1, message = "Old password is required"))]
    pub old_password: String,
    #[validate(length(
        min = 8,
        max = 128,
        message = "New password must be between 8 and 128 characters"
    ))]
    #[validate(custom(function = "validate_password_strength"))]
    pub new_password: String,
}

#[derive(Serialize, Deserialize, Validate, Debug)]
pub struct UpdateThemeRequest {
    #[validate(regex(
        path = "*crate::domain::models::THEME_REGEX",
        message = "Invalid theme. Must be 'light' or 'dark'"
    ))]
    pub theme: String,
}

use once_cell::sync::Lazy;
use regex::Regex;
pub static THEME_REGEX: Lazy<Regex> = Lazy::new(|| Regex::new(r"^(light|dark)$").unwrap());

// Validates that image_url is a valid HTTPS URL (not javascript:, data:, etc.)
pub static IMAGE_URL_REGEX: Lazy<Regex> =
    Lazy::new(|| Regex::new(r"^https://[a-zA-Z0-9\-._~:/?#\[\]@!$&'()*+,;=%]+$").unwrap());

/// Validates password strength: at least 8 chars, one uppercase, one lowercase, one digit
pub fn validate_password_strength(password: &str) -> Result<(), validator::ValidationError> {
    if password.len() < 8 {
        return Err(validator::ValidationError::new("password_too_short"));
    }

    let has_lowercase = password.chars().any(|c| c.is_ascii_lowercase());
    let has_uppercase = password.chars().any(|c| c.is_ascii_uppercase());
    let has_digit = password.chars().any(|c| c.is_ascii_digit());

    if !has_lowercase || !has_uppercase || !has_digit {
        let mut err = validator::ValidationError::new("password_weak");
        err.message = Some(std::borrow::Cow::Borrowed(
            "Password must contain at least one uppercase letter, one lowercase letter, and one digit"
        ));
        return Err(err);
    }

    Ok(())
}
