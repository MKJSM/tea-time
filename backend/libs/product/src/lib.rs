use chrono::{DateTime, Utc};
use deadpool_postgres::Pool;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use backend_shared::AppError;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Product {
    pub id: Uuid,
    pub name: String,
    pub images: Vec<String>,
    pub price: f64,
    pub description: Option<String>,
    pub created_on: DateTime<Utc>,
    pub modified_on: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CategoryProduct {
    pub category_id: Uuid,
    pub product_id: Uuid,
}

pub async fn list(_pool: &Pool) -> Result<serde_json::Value, AppError> {
    Ok(serde_json::json!({
        "ok": true,
        "items": Vec::<Product>::new(),
    }))
}
