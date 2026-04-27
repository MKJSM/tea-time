use chrono::{DateTime, Utc};
use deadpool_postgres::Pool;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use backend_auth::{hash_password, verify_password};
use backend_session::{create_session, SessionScope, SessionToken, ADMIN_SESSION_COOKIE};
use backend_shared::{map_pool_error_to_app_error, AppError};

pub const DEFAULT_ADMIN_EMAIL: &str = "admin@tea-time.local";
pub const DEFAULT_ADMIN_PASSWORD: &str = "admin@2026";
pub const DEFAULT_ADMIN_USER_NAME: &str = "admin";

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

#[derive(Debug, Deserialize)]
pub struct LoginInput {
    pub email: String,
    pub password: String,
}

#[derive(Debug, Serialize)]
pub struct AuthResponse {
    pub admin: AdminProfile,
    pub session_cookie: &'static str,
}

#[derive(Debug, Serialize)]
pub struct AdminProfile {
    pub id: String,
    pub user_name: String,
    pub first_name: String,
    pub last_name: String,
    pub phone: Option<String>,
    pub email: String,
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

pub async fn ensure_default_admin(
    pool: &Pool,
    email: &str,
    password: &str,
) -> Result<(), AppError> {
    if email.trim().is_empty() || password.trim().is_empty() {
        return Ok(());
    }

    let client = pool.get().await.map_err(map_pool_error_to_app_error)?;
    let normalized_email = email.trim().to_lowercase();
    let existing = client
        .query_opt(
            "SELECT id::text FROM admin_user WHERE email = $1",
            &[&normalized_email],
        )
        .await?;

    let password_hash = hash_password(password.trim()).map_err(|error| {
        AppError::Config(format!("failed to hash default admin password: {error}"))
    })?;

    if existing.is_some() {
        client
            .execute(
                "UPDATE admin_user
                 SET user_name = $1,
                     first_name = $2,
                     last_name = $3,
                     phone = $4,
                     password_hash = $5
                 WHERE email = $6",
                &[
                    &DEFAULT_ADMIN_USER_NAME.to_string(),
                    &"Tea".to_string(),
                    &"Admin".to_string(),
                    &Option::<String>::None,
                    &password_hash,
                    &normalized_email,
                ],
            )
            .await?;
    } else {
        client
            .execute(
                "INSERT INTO admin_user (id, user_name, first_name, last_name, phone, email, password_hash)
                 VALUES ($1::text::uuid, $2, $3, $4, $5, $6, $7)",
                &[
                    &Uuid::new_v4().to_string(),
                    &DEFAULT_ADMIN_USER_NAME.to_string(),
                    &"Tea".to_string(),
                    &"Admin".to_string(),
                    &Option::<String>::None,
                    &normalized_email,
                    &password_hash,
                ],
            )
            .await?;
    }

    Ok(())
}

pub async fn login(
    pool: &Pool,
    input: LoginInput,
) -> Result<(AuthResponse, SessionToken), AppError> {
    if input.email.trim().is_empty() || input.password.is_empty() {
        return Err(AppError::BadRequest(
            "email and password are required".to_string(),
        ));
    }

    let email = input.email.trim().to_lowercase();
    let client = pool.get().await.map_err(map_pool_error_to_app_error)?;
    let row = client
        .query_opt(
            "SELECT id::text, user_name, first_name, last_name, phone, email, password_hash
             FROM admin_user
             WHERE email = $1",
            &[&email],
        )
        .await?;

    let row = row.ok_or_else(|| AppError::Unauthorized("invalid admin credentials".to_string()))?;
    let password_hash: String = row.get(6);
    let password_ok = verify_password(&input.password, &password_hash)
        .map_err(|error| AppError::Config(format!("failed to verify password: {error}")))?;

    if !password_ok {
        return Err(AppError::Unauthorized(
            "invalid admin credentials".to_string(),
        ));
    }

    let admin_id = parse_uuid_cell(&row, 0)?;
    let response = AuthResponse {
        admin: AdminProfile {
            id: admin_id.to_string(),
            user_name: row.get(1),
            first_name: row.get(2),
            last_name: row.get(3),
            phone: row.get(4),
            email: row.get(5),
        },
        session_cookie: ADMIN_SESSION_COOKIE,
    };
    let session = create_session(pool, SessionScope::Admin, admin_id).await?;

    Ok((response, session))
}

pub async fn me(pool: &Pool, admin_id: Uuid) -> Result<AuthResponse, AppError> {
    let client = pool.get().await.map_err(map_pool_error_to_app_error)?;
    let row = client
        .query_opt(
            "SELECT id::text, user_name, first_name, last_name, phone, email
             FROM admin_user
             WHERE id = $1::text::uuid",
            &[&admin_id.to_string()],
        )
        .await?;

    let row = row.ok_or_else(|| AppError::NotFound("admin user not found".to_string()))?;

    Ok(AuthResponse {
        admin: AdminProfile {
            id: row.get(0),
            user_name: row.get(1),
            first_name: row.get(2),
            last_name: row.get(3),
            phone: row.get(4),
            email: row.get(5),
        },
        session_cookie: ADMIN_SESSION_COOKIE,
    })
}

fn parse_uuid_cell(row: &tokio_postgres::Row, index: usize) -> Result<Uuid, AppError> {
    let value: String = row.get(index);
    Uuid::parse_str(&value)
        .map_err(|error| AppError::Config(format!("invalid uuid value: {error}")))
}
