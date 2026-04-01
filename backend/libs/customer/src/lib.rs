use chrono::{DateTime, Utc};
use deadpool_postgres::Pool;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use backend_session::CUSTOMER_SESSION_COOKIE;
use backend_shared::{map_pool_error_to_app_error, AppError};

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum AuthType {
    Password,
    Google,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct User {
    pub id: Uuid,
    pub user_name: String,
    pub first_name: String,
    pub last_name: String,
    pub phone: Option<String>,
    pub email: String,
    pub created_on: DateTime<Utc>,
    pub modified_on: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UserHash {
    pub id: Uuid,
    pub user_id: Uuid,
    pub auth_type: AuthType,
    pub hash_value: String,
    pub created_on: DateTime<Utc>,
    pub modified_on: DateTime<Utc>,
}

pub async fn health(pool: &Pool) -> Result<serde_json::Value, AppError> {
    let client = pool.get().await.map_err(map_pool_error_to_app_error)?;
    let row = client.query_one("SELECT 1", &[]).await?;
    let db_ok: i32 = row.get(0);

    Ok(serde_json::json!({
        "ok": true,
        "service": "backend",
        "scope": "customer",
        "database": db_ok == 1,
    }))
}

pub fn customer_health() -> serde_json::Value {
    serde_json::json!({
        "ok": true,
        "scope": "customer",
    })
}

pub fn auth_health() -> serde_json::Value {
    serde_json::json!({
        "ok": true,
        "scope": "customer_auth",
        "session_cookie": CUSTOMER_SESSION_COOKIE,
    })
}
