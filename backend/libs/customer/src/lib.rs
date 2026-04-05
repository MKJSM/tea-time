use chrono::{DateTime, Utc};
use deadpool_postgres::Pool;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use backend_auth::{hash_password, verify_password};
use backend_session::{create_session, SessionScope, SessionToken, CUSTOMER_SESSION_COOKIE};
use backend_shared::{is_unique_violation, map_pool_error_to_app_error, AppError};

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

#[derive(Debug, Deserialize)]
pub struct RegisterInput {
    pub user_name: String,
    pub first_name: String,
    pub last_name: String,
    pub phone: Option<String>,
    pub email: String,
    pub password: String,
}

#[derive(Debug, Deserialize)]
pub struct LoginInput {
    pub email: String,
    pub password: String,
}

#[derive(Debug, Serialize)]
pub struct AuthResponse {
    pub user: UserProfile,
    pub session_cookie: &'static str,
}

#[derive(Debug, Serialize)]
pub struct UserProfile {
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

pub async fn register(
    pool: &Pool,
    input: RegisterInput,
) -> Result<(AuthResponse, SessionToken), AppError> {
    validate_registration_input(&input)?;

    let mut client = pool.get().await.map_err(map_pool_error_to_app_error)?;
    let transaction = client.transaction().await?;
    let user_id = Uuid::new_v4();
    let user_hash_id = Uuid::new_v4();
    let email = input.email.trim().to_lowercase();
    let user_name = input.user_name.trim().to_string();
    let first_name = input.first_name.trim().to_string();
    let last_name = input.last_name.trim().to_string();
    let phone = input.phone.as_ref().map(|value| value.trim().to_string());
    let password_hash = hash_password(input.password.trim())
        .map_err(|error| AppError::Config(format!("failed to hash password: {error}")))?;

    let insert_user = transaction
        .execute(
            "INSERT INTO \"user\" (id, user_name, first_name, last_name, phone, email)
             VALUES ($1::uuid, $2, $3, $4, $5, $6)",
            &[
                &user_id.to_string(),
                &user_name,
                &first_name,
                &last_name,
                &phone,
                &email,
            ],
        )
        .await;

    if let Err(error) = insert_user {
        return if is_unique_violation(&error) {
            Err(AppError::Conflict(
                "customer email already exists".to_string(),
            ))
        } else {
            Err(AppError::Database(error))
        };
    }

    transaction
        .execute(
            "INSERT INTO user_hash (id, user_id, auth_type, hash_value)
             VALUES ($1::uuid, $2::uuid, 'password', $3)",
            &[
                &user_hash_id.to_string(),
                &user_id.to_string(),
                &password_hash,
            ],
        )
        .await?;

    transaction.commit().await?;

    let response = AuthResponse {
        user: UserProfile {
            id: user_id.to_string(),
            user_name,
            first_name,
            last_name,
            phone,
            email,
        },
        session_cookie: CUSTOMER_SESSION_COOKIE,
    };
    let session = create_session(pool, SessionScope::Customer, user_id).await?;

    Ok((response, session))
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
            "SELECT u.id::text, u.user_name, u.first_name, u.last_name, u.phone, u.email, uh.hash_value
             FROM \"user\" u
             INNER JOIN user_hash uh ON uh.user_id = u.id
             WHERE u.email = $1
               AND uh.auth_type = 'password'",
            &[&email],
        )
        .await?;

    let row =
        row.ok_or_else(|| AppError::Unauthorized("invalid customer credentials".to_string()))?;
    let password_hash: String = row.get(6);
    let password_ok = verify_password(&input.password, &password_hash)
        .map_err(|error| AppError::Config(format!("failed to verify password: {error}")))?;

    if !password_ok {
        return Err(AppError::Unauthorized(
            "invalid customer credentials".to_string(),
        ));
    }

    let user_id = parse_uuid_cell(&row, 0)?;
    let response = AuthResponse {
        user: UserProfile {
            id: user_id.to_string(),
            user_name: row.get(1),
            first_name: row.get(2),
            last_name: row.get(3),
            phone: row.get(4),
            email: row.get(5),
        },
        session_cookie: CUSTOMER_SESSION_COOKIE,
    };
    let session = create_session(pool, SessionScope::Customer, user_id).await?;

    Ok((response, session))
}

pub async fn me(pool: &Pool, user_id: Uuid) -> Result<AuthResponse, AppError> {
    let client = pool.get().await.map_err(map_pool_error_to_app_error)?;
    let row = client
        .query_opt(
            "SELECT id::text, user_name, first_name, last_name, phone, email
             FROM \"user\"
             WHERE id = $1::uuid",
            &[&user_id.to_string()],
        )
        .await?;

    let row = row.ok_or_else(|| AppError::NotFound("customer not found".to_string()))?;

    Ok(AuthResponse {
        user: UserProfile {
            id: row.get(0),
            user_name: row.get(1),
            first_name: row.get(2),
            last_name: row.get(3),
            phone: row.get(4),
            email: row.get(5),
        },
        session_cookie: CUSTOMER_SESSION_COOKIE,
    })
}

fn validate_registration_input(input: &RegisterInput) -> Result<(), AppError> {
    if input.user_name.trim().is_empty()
        || input.first_name.trim().is_empty()
        || input.last_name.trim().is_empty()
        || input.email.trim().is_empty()
        || input.password.is_empty()
    {
        return Err(AppError::BadRequest(
            "user_name, first_name, last_name, email, and password are required".to_string(),
        ));
    }

    if input.password.len() < 8 {
        return Err(AppError::BadRequest(
            "password must be at least 8 characters".to_string(),
        ));
    }

    Ok(())
}

fn parse_uuid_cell(row: &tokio_postgres::Row, index: usize) -> Result<Uuid, AppError> {
    let value: String = row.get(index);
    Uuid::parse_str(&value)
        .map_err(|error| AppError::Config(format!("invalid uuid value: {error}")))
}
