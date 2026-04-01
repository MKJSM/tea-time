use chrono::{DateTime, Utc};
use deadpool_postgres::Pool;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use backend_shared::AppError;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Category {
    pub id: Uuid,
    pub name: String,
    pub images: Vec<String>,
    pub created_on: DateTime<Utc>,
    pub modified_on: DateTime<Utc>,
}

pub async fn list(_pool: &Pool) -> Result<serde_json::Value, AppError> {
    Ok(serde_json::json!({
        "ok": true,
        "items": Vec::<Category>::new(),
    }))
}
