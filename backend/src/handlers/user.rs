use crate::auth::RequiredAuthUser;
use crate::domain::models::{
    Address, ChangePasswordRequest, DeviceResponse, UpdateThemeRequest, UpdateUserProfileRequest,
    UserProfileResponseFull,
};
use crate::error::AppError;
use crate::state::AppState;
use argon2::password_hash::rand_core::OsRng;
use argon2::{
    password_hash::{PasswordHash, PasswordHasher, PasswordVerifier, SaltString},
    Argon2,
};
use axum::extract::{Json, State};
use axum::http::StatusCode;
use sqlx::Row;
use tower_sessions::Session;
use validator::Validate;

/// GET /api/user/profile
///
/// Returns a consolidated view of the authenticated user including:
/// - Identity: name, email, phone, image_url, theme
/// - Addresses: Array of full address objects
/// - Activity: active_orders_count, wishlist_count
#[tracing::instrument(skip(user, state))]
pub async fn get_user_profile(
    user: RequiredAuthUser,
    State(state): State<AppState>,
) -> Result<Json<UserProfileResponseFull>, AppError> {
    // Fetch user details
    let db_user =
        sqlx::query("SELECT name, email, phone, image_url, theme FROM users WHERE id = $1")
            .bind(user.id)
            .fetch_optional(&state.db)
            .await?
            .ok_or_else(|| AppError::NotFound("User not found".into()))?;

    let name: String = db_user.get("name");
    let email: String = db_user.get("email");
    let phone: String = db_user.get("phone");
    let image_url: Option<String> = db_user.get("image_url");
    let theme: String = db_user.get("theme");

    // Fetch full addresses
    let addresses = sqlx::query_as::<_, Address>(
        "SELECT * FROM addresses WHERE user_id = $1 ORDER BY is_default DESC, created_at DESC",
    )
    .bind(user.id)
    .fetch_all(&state.db)
    .await?;

    // Fetch active orders count
    let active_orders: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM orders WHERE user_id = $1 AND status NOT IN ('delivered', 'cancelled')")
        .bind(user.id)
        .fetch_one(&state.db)
        .await
        .unwrap_or((0i64,));

    // Fetch wishlist count (favorites)
    let wishlist: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM favorites WHERE user_id = $1")
        .bind(user.id)
        .fetch_one(&state.db)
        .await
        .unwrap_or((0i64,));

    Ok(Json(UserProfileResponseFull {
        name,
        email,
        phone,
        image_url,
        theme,
        addresses,
        active_orders_count: active_orders.0 as i32,
        wishlist_count: wishlist.0 as i32,
        is_deleted: false,
    }))
}

/// PUT /api/user/profile
///
/// Updates user profile details (name, email, phone, image_url).
#[tracing::instrument(skip(user, state, payload))]
pub async fn update_user_profile(
    user: RequiredAuthUser,
    State(state): State<AppState>,
    Json(payload): Json<UpdateUserProfileRequest>,
) -> Result<Json<UserProfileResponseFull>, AppError> {
    payload
        .validate()
        .map_err(|e| AppError::BadRequest(e.to_string()))?;

    let mut tx = state.db.begin().await?;

    // Check if email is being changed and if it's already taken
    if let Some(ref email) = payload.email {
        let existing = sqlx::query("SELECT id FROM users WHERE email = $1 AND id != $2")
            .bind(email)
            .bind(user.id)
            .fetch_optional(&mut *tx)
            .await?;

        if existing.is_some() {
            return Err(AppError::Conflict("Email already in use".into()));
        }
    }

    // Build update query
    let mut query_builder = sqlx::QueryBuilder::new("UPDATE users SET ");
    let mut separated = query_builder.separated(", ");

    if let Some(ref name) = payload.name {
        separated.push("name = ");
        separated.push_bind_unseparated(name);
    }
    if let Some(ref email) = payload.email {
        separated.push("email = ");
        separated.push_bind_unseparated(email);
    }
    if let Some(ref phone) = payload.phone {
        separated.push("phone = ");
        separated.push_bind_unseparated(phone);
    }
    if let Some(ref image_url) = payload.image_url {
        separated.push("image_url = ");
        separated.push_bind_unseparated(image_url);
    }

    query_builder.push(" WHERE id = ");
    query_builder.push_bind(user.id);

    let query = query_builder.build();
    query.execute(&mut *tx).await?;

    tx.commit().await?;

    get_user_profile(user, State(state)).await
}

/// POST /api/user/password
///
/// Securely changes the user's password.
#[tracing::instrument(skip(user, state, payload))]
pub async fn change_password(
    user: RequiredAuthUser,
    State(state): State<AppState>,
    Json(payload): Json<ChangePasswordRequest>,
) -> Result<Json<serde_json::Value>, AppError> {
    payload
        .validate()
        .map_err(|e| AppError::BadRequest(e.to_string()))?;

    if payload.old_password == payload.new_password {
        return Err(AppError::BadRequest(
            "New password cannot be the same as the current password".into(),
        ));
    }

    let user_data = sqlx::query("SELECT password_hash FROM users WHERE id = $1")
        .bind(user.id)
        .fetch_optional(&state.db)
        .await?
        .ok_or_else(|| AppError::NotFound("User not found".into()))?;

    let password_hash: String = user_data.get("password_hash");

    let parsed_hash = PasswordHash::new(&password_hash)
        .map_err(|_| AppError::InternalServerError("Invalid password hash format".into()))?;

    let argon2 = Argon2::default();
    argon2
        .verify_password(payload.old_password.as_bytes(), &parsed_hash)
        .map_err(|_| AppError::Unauthorized("Incorrect old password".into()))?;

    let salt = SaltString::generate(&mut OsRng);
    let new_password_hash = argon2
        .hash_password(payload.new_password.as_bytes(), &salt)
        .map_err(|e| AppError::InternalServerError(e.to_string()))?
        .to_string();

    sqlx::query("UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2")
        .bind(&new_password_hash)
        .bind(user.id)
        .execute(&state.db)
        .await?;

    Ok(Json(serde_json::json!({
        "message": "Password changed successfully"
    })))
}

/// PUT /api/user/theme
///
/// Updates the user's theme preference (light/dark).
#[tracing::instrument(skip(user, state, payload))]
pub async fn update_theme(
    user: RequiredAuthUser,
    State(state): State<AppState>,
    Json(payload): Json<UpdateThemeRequest>,
) -> Result<StatusCode, AppError> {
    payload
        .validate()
        .map_err(|e| AppError::BadRequest(e.to_string()))?;

    sqlx::query("UPDATE users SET theme = $1, updated_at = NOW() WHERE id = $2")
        .bind(&payload.theme)
        .bind(user.id)
        .execute(&state.db)
        .await?;

    Ok(StatusCode::OK)
}

/// GET /api/user/devices
///
/// Returns a list of active sessions for the user.
#[tracing::instrument(skip(user, state, session))]
pub async fn get_user_devices(
    user: RequiredAuthUser,
    State(state): State<AppState>,
    session: Session,
) -> Result<Json<Vec<DeviceResponse>>, AppError> {
    let current_session_id = session.id().map(|id| id.to_string()).unwrap_or_default();
    let user_id = user.id.to_string();

    let sessions = state
        .session_store
        .get_sessions_for_user(&user_id)
        .await
        .map_err(|e| AppError::InternalServerError(format!("Failed to fetch devices: {}", e)))?;

    let devices = sessions
        .into_iter()
        .map(|s| {
            let last_active_at =
                chrono::DateTime::from_timestamp(s.last_active_at.unix_timestamp(), 0)
                    .unwrap_or_default();
            DeviceResponse {
                session_id: s.id.clone(),
                ip_address: s.ip_address,
                user_agent: s.user_agent,
                last_active_at: Some(last_active_at),
                is_current: s.id == current_session_id,
            }
        })
        .collect();

    Ok(Json(devices))
}
