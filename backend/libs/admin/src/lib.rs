use chrono::{DateTime, Utc};
use deadpool_postgres::Pool;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use backend_session::ADMIN_SESSION_COOKIE;
use backend_shared::{map_pool_error_to_app_error, AppError};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AdminUser {
    pub id: Uuid,
    pub user_name: String,
    pub first_name: String,
    pub last_name: String,
    pub phone: Option<String>,
    pub email: String,
    pub password_hash: String,
    pub created_on: DateTime<Utc>,
    pub modified_on: DateTime<Utc>,
}

pub async fn health(pool: &Pool) -> Result<serde_json::Value, AppError> {
    let client = pool.get().await.map_err(map_pool_error_to_app_error)?;
    let row = client.query_one("SELECT 1", &[]).await?;
    let db_ok: i32 = row.get(0);

    Ok(serde_json::json!({
        "ok": true,
        "scope": "admin",
        "database": db_ok == 1,
    }))
}

pub fn auth_health() -> serde_json::Value {
    serde_json::json!({
        "ok": true,
        "scope": "admin_auth",
        "session_cookie": ADMIN_SESSION_COOKIE,
    })
}
