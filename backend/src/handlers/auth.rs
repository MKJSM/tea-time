use axum::{
    extract::{State, Json},
    http::{StatusCode, HeaderMap},
    response::IntoResponse,
};
use crate::state::AppState;
use crate::domain::models::{User, Session, CreateUserRequest, LoginUserRequest, AuthResponse};
use crate::error::AppError;
use sqlx::Row;
use argon2::{
    password_hash::{
        rand_core::OsRng,
        PasswordHash, PasswordHasher, PasswordVerifier, SaltString
    },
    Argon2
};
use uuid::Uuid;
use chrono::{Utc, Duration};

const SESSION_DURATION_DAYS: i64 = 30;

pub async fn signup(
    State(state): State<AppState>,
    Json(payload): Json<CreateUserRequest>,
) -> Result<impl IntoResponse, AppError> {
    // 1. Check if user exists
    let exists = sqlx::query("SELECT 1 FROM users WHERE email = ?")
        .bind(&payload.email)
        .fetch_optional(&state.db)
        .await?;

    if exists.is_some() {
        return Err(AppError::InternalServerError("User already exists".into())); // Use appropriate error code in real app
    }

    // 2. Hash password
    let salt = SaltString::generate(&mut OsRng);
    let argon2 = Argon2::default();
    let password_hash = argon2.hash_password(payload.password.as_bytes(), &salt)
        .map_err(|e| AppError::InternalServerError(e.to_string()))?
        .to_string();

    // 3. Insert User
    let phone = payload.phone.unwrap_or_default();
    let user_id = sqlx::query(
        "INSERT INTO users (name, email, phone, password_hash) VALUES (?, ?, ?, ?) RETURNING id"
    )
    .bind(&payload.name)
    .bind(&payload.email)
    .bind(&phone)
    .bind(&password_hash)
    .fetch_one(&state.db)
    .await?
    .get::<i32, _>(0);

    // 4. Create Session
    let token = Uuid::new_v4().to_string();
    let expires_at = Utc::now() + Duration::days(SESSION_DURATION_DAYS);

    sqlx::query("INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)")
        .bind(&token)
        .bind(user_id)
        .bind(expires_at)
        .execute(&state.db)
        .await?;

    // 5. Fetch Full User
    let user = sqlx::query_as::<_, User>("SELECT * FROM users WHERE id = ?")
        .bind(user_id)
        .fetch_one(&state.db)
        .await?;

    let cookie = format!(
        "token={}; HttpOnly; SameSite=Strict; Path=/; Max-Age={}", 
        token, 
        SESSION_DURATION_DAYS * 24 * 60 * 60
    );

    let mut headers = HeaderMap::new();
    headers.insert("Set-Cookie", cookie.parse().unwrap());

    Ok((StatusCode::OK, headers, Json(AuthResponse { user, token: "".to_string() })))
}

pub async fn login(
    State(state): State<AppState>,
    Json(payload): Json<LoginUserRequest>,
) -> Result<impl IntoResponse, AppError> {
    let user = sqlx::query_as::<_, User>("SELECT * FROM users WHERE email = ?")
        .bind(&payload.email)
        .fetch_optional(&state.db)
        .await?
        .ok_or_else(|| AppError::Unauthorized("Invalid credentials".into()))?;

    // Verify Password if provided (for social login simulation we might skip, but let's enforce for now)
    if let Some(pwd) = payload.password {
        let parsed_hash = PasswordHash::new(&user.password_hash)
            .map_err(|e| AppError::InternalServerError(e.to_string()))?;
        
        Argon2::default().verify_password(pwd.as_bytes(), &parsed_hash)
            .map_err(|_| AppError::Unauthorized("Invalid credentials".into()))?;
    } else {
        // Handle "Social" login simulation without password? 
        // For security, strict login requires password. 
        // If the user request implies handling social mocks, we might auto-login or fail.
        // Let's assume normal flow for now.
        return Err(AppError::InternalServerError("Password required".into()));
    }

    // Check for existing valid session
    let existing_session = sqlx::query_as::<_, Session>("SELECT * FROM sessions WHERE user_id = ? AND expires_at > CURRENT_TIMESTAMP LIMIT 1")
        .bind(user.id)
        .fetch_optional(&state.db)
        .await?;

    let token = if let Some(session) = existing_session {
        // Extend the session
        let expires_at = Utc::now() + Duration::days(SESSION_DURATION_DAYS);
        sqlx::query("UPDATE sessions SET expires_at = ? WHERE id = ?")
            .bind(expires_at)
            .bind(&session.id)
            .execute(&state.db)
            .await?;
        session.id
    } else {
        // Create new session
        let token = Uuid::new_v4().to_string();
        let expires_at = Utc::now() + Duration::days(SESSION_DURATION_DAYS);

        sqlx::query("INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)")
            .bind(&token)
            .bind(user.id)
            .bind(expires_at)
            .execute(&state.db)
            .await?;
        token
    };

    let cookie = format!(
        "token={}; HttpOnly; SameSite=Strict; Path=/; Max-Age={}", 
        token, 
        SESSION_DURATION_DAYS * 24 * 60 * 60
    );

    let mut headers = HeaderMap::new();
    headers.insert("Set-Cookie", cookie.parse().unwrap());

    Ok((StatusCode::OK, headers, Json(AuthResponse { user, token: "".to_string() }))) // Token removed from body
}

pub async fn get_me(
    State(state): State<AppState>,
    headers: HeaderMap,
) -> Result<Json<User>, AppError> {
    let cookie_header = headers.get("Cookie")
        .ok_or_else(|| AppError::Unauthorized("Missing cookie".into()))?
        .to_str()
        .map_err(|_| AppError::Unauthorized("Invalid cookie format".into()))?;

    let token = cookie_header
        .split(';')
        .find_map(|s| {
            let parts: Vec<&str> = s.trim().split('=').collect();
            if parts.len() == 2 && parts[0] == "token" {
                Some(parts[1])
            } else {
                None
            }
        })
        .ok_or_else(|| AppError::Unauthorized("Token not found in cookie".into()))?;

    // Validate session
    let session = sqlx::query_as::<_, Session>("SELECT * FROM sessions WHERE id = ? AND expires_at > CURRENT_TIMESTAMP")
        .bind(token)
        .fetch_optional(&state.db)
        .await?
        .ok_or_else(|| AppError::Unauthorized("Invalid or expired session".into()))?;

    let user = sqlx::query_as::<_, User>("SELECT * FROM users WHERE id = ?")
        .bind(session.user_id)
        .fetch_one(&state.db)
        .await?;

    Ok(Json(user))
}

pub async fn logout(
    State(state): State<AppState>,
    headers: HeaderMap,
) -> Result<impl IntoResponse, AppError> {
    // Attempt to get token to delete from DB, but don't fail if missing (idempotent logout)
    if let Some(cookie_header) = headers.get("Cookie").and_then(|v| v.to_str().ok()) {
        if let Some(token) = cookie_header.split(';').find_map(|s| {
            let parts: Vec<&str> = s.trim().split('=').collect();
            if parts.len() == 2 && parts[0] == "token" {
                Some(parts[1])
            } else {
                None
            }
        }) {
             let _ = sqlx::query("DELETE FROM sessions WHERE id = ?")
                .bind(token)
                .execute(&state.db)
                .await;
        }
    }

    let cookie = "token=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0";
    let mut headers = HeaderMap::new();
    headers.insert("Set-Cookie", cookie.parse().unwrap());

    Ok((StatusCode::OK, headers))
}
