use crate::auth::AuthSession;
use crate::domain::models::{Address, CreateAddressRequest, UpdateAddressRequest};
use crate::error::AppError;
use crate::state::AppState;
use axum::{
    extract::{Json, Path, State},
    http::StatusCode,
    response::IntoResponse,
};
use uuid::Uuid;
use validator::Validate;

/// List all addresses for the authenticated user
#[tracing::instrument(skip(auth_session, state))]
pub async fn list_addresses(
    auth_session: AuthSession,
    State(state): State<AppState>,
) -> Result<Json<Vec<Address>>, AppError> {
    let user = auth_session
        .user
        .ok_or(AppError::Unauthorized("Not authenticated".into()))?;

    let addresses = sqlx::query_as::<_, Address>(
        "SELECT * FROM addresses WHERE user_id = ? ORDER BY is_default DESC, created_at DESC"
    )
    .bind(&user.id)
    .fetch_all(&state.db)
    .await?;

    Ok(Json(addresses))
}

/// Get a single address by ID
#[tracing::instrument(skip(auth_session, state))]
pub async fn get_address(
    auth_session: AuthSession,
    State(state): State<AppState>,
    Path(id): Path<String>,
) -> Result<Json<Address>, AppError> {
    let user = auth_session
        .user
        .ok_or(AppError::Unauthorized("Not authenticated".into()))?;

    let address = sqlx::query_as::<_, Address>(
        "SELECT * FROM addresses WHERE id = ? AND user_id = ?"
    )
    .bind(&id)
    .bind(&user.id)
    .fetch_optional(&state.db)
    .await?
    .ok_or_else(|| AppError::NotFound("Address not found".into()))?;

    Ok(Json(address))
}

/// Create a new address
#[tracing::instrument(skip(auth_session, state, payload))]
pub async fn create_address(
    auth_session: AuthSession,
    State(state): State<AppState>,
    Json(payload): Json<CreateAddressRequest>,
) -> Result<Json<Address>, AppError> {
    let user = auth_session
        .user
        .ok_or(AppError::Unauthorized("Not authenticated".into()))?;

    // Validate input
    payload.validate().map_err(|e| {
        let errors: Vec<String> = e
            .field_errors()
            .values()
            .flat_map(|errs| {
                errs.iter()
                    .filter_map(|e| e.message.as_ref().map(|m| m.to_string()))
            })
            .collect();
        AppError::BadRequest(errors.join(", "))
    })?;

    let address_id = Uuid::new_v4().to_string();

    // If this is marked as default, unset all other defaults first
    if payload.is_default {
        sqlx::query("UPDATE addresses SET is_default = 0 WHERE user_id = ?")
            .bind(&user.id)
            .execute(&state.db)
            .await?;
    }

    // Check if user has any addresses - if not, make this one default
    let count: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM addresses WHERE user_id = ?")
        .bind(&user.id)
        .fetch_one(&state.db)
        .await?;

    let is_default = payload.is_default || count.0 == 0;

    sqlx::query(
        r#"INSERT INTO addresses
           (id, user_id, label, recipient_name, phone_number, street_address, city, state, postal_code, latitude, longitude, is_default)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"#
    )
    .bind(&address_id)
    .bind(&user.id)
    .bind(&payload.label)
    .bind(&payload.recipient_name)
    .bind(&payload.phone_number)
    .bind(&payload.street_address)
    .bind(&payload.city)
    .bind(&payload.state)
    .bind(&payload.postal_code)
    .bind(&payload.latitude)
    .bind(&payload.longitude)
    .bind(is_default)
    .execute(&state.db)
    .await?;

    // Fetch and return the created address
    let address = sqlx::query_as::<_, Address>("SELECT * FROM addresses WHERE id = ?")
        .bind(&address_id)
        .fetch_one(&state.db)
        .await?;

    Ok(Json(address))
}

/// Update an existing address
#[tracing::instrument(skip(auth_session, state, payload))]
pub async fn update_address(
    auth_session: AuthSession,
    State(state): State<AppState>,
    Path(id): Path<String>,
    Json(payload): Json<UpdateAddressRequest>,
) -> Result<Json<Address>, AppError> {
    let user = auth_session
        .user
        .ok_or(AppError::Unauthorized("Not authenticated".into()))?;

    // Check if address exists and belongs to user
    let existing = sqlx::query_as::<_, Address>(
        "SELECT * FROM addresses WHERE id = ? AND user_id = ?"
    )
    .bind(&id)
    .bind(&user.id)
    .fetch_optional(&state.db)
    .await?
    .ok_or_else(|| AppError::NotFound("Address not found".into()))?;

    // If setting as default, unset others first
    if payload.is_default == Some(true) {
        sqlx::query("UPDATE addresses SET is_default = 0 WHERE user_id = ?")
            .bind(&user.id)
            .execute(&state.db)
            .await?;
    }

    // Build update query dynamically
    let label = payload.label.unwrap_or(existing.label);
    let recipient_name = payload.recipient_name.unwrap_or(existing.recipient_name);
    let phone_number = payload.phone_number.unwrap_or(existing.phone_number);
    let street_address = payload.street_address.unwrap_or(existing.street_address);
    let city = payload.city.unwrap_or(existing.city);
    let state_field = payload.state.unwrap_or(existing.state);
    let postal_code = payload.postal_code.unwrap_or(existing.postal_code);
    let latitude = payload.latitude.or(existing.latitude);
    let longitude = payload.longitude.or(existing.longitude);
    let is_default = payload.is_default.unwrap_or(existing.is_default);

    sqlx::query(
        r#"UPDATE addresses SET
           label = ?, recipient_name = ?, phone_number = ?, street_address = ?,
           city = ?, state = ?, postal_code = ?, latitude = ?, longitude = ?, is_default = ?
           WHERE id = ? AND user_id = ?"#
    )
    .bind(&label)
    .bind(&recipient_name)
    .bind(&phone_number)
    .bind(&street_address)
    .bind(&city)
    .bind(&state_field)
    .bind(&postal_code)
    .bind(&latitude)
    .bind(&longitude)
    .bind(is_default)
    .bind(&id)
    .bind(&user.id)
    .execute(&state.db)
    .await?;

    // Fetch and return the updated address
    let address = sqlx::query_as::<_, Address>("SELECT * FROM addresses WHERE id = ?")
        .bind(&id)
        .fetch_one(&state.db)
        .await?;

    Ok(Json(address))
}

/// Delete an address
#[tracing::instrument(skip(auth_session, state))]
pub async fn delete_address(
    auth_session: AuthSession,
    State(state): State<AppState>,
    Path(id): Path<String>,
) -> Result<impl IntoResponse, AppError> {
    let user = auth_session
        .user
        .ok_or(AppError::Unauthorized("Not authenticated".into()))?;

    // Check if address exists and belongs to user
    let address = sqlx::query_as::<_, Address>(
        "SELECT * FROM addresses WHERE id = ? AND user_id = ?"
    )
    .bind(&id)
    .bind(&user.id)
    .fetch_optional(&state.db)
    .await?
    .ok_or_else(|| AppError::NotFound("Address not found".into()))?;

    // Delete the address
    sqlx::query("DELETE FROM addresses WHERE id = ? AND user_id = ?")
        .bind(&id)
        .bind(&user.id)
        .execute(&state.db)
        .await?;

    // If this was the default address, set another one as default
    if address.is_default {
        sqlx::query(
            "UPDATE addresses SET is_default = 1 WHERE user_id = ? ORDER BY created_at DESC LIMIT 1"
        )
        .bind(&user.id)
        .execute(&state.db)
        .await?;
    }

    Ok(StatusCode::NO_CONTENT)
}

/// Set an address as the default
#[tracing::instrument(skip(auth_session, state))]
pub async fn set_default_address(
    auth_session: AuthSession,
    State(state): State<AppState>,
    Path(id): Path<String>,
) -> Result<Json<Address>, AppError> {
    let user = auth_session
        .user
        .ok_or(AppError::Unauthorized("Not authenticated".into()))?;

    // Check if address exists and belongs to user
    sqlx::query_as::<_, Address>(
        "SELECT * FROM addresses WHERE id = ? AND user_id = ?"
    )
    .bind(&id)
    .bind(&user.id)
    .fetch_optional(&state.db)
    .await?
    .ok_or_else(|| AppError::NotFound("Address not found".into()))?;

    // Unset all defaults
    sqlx::query("UPDATE addresses SET is_default = 0 WHERE user_id = ?")
        .bind(&user.id)
        .execute(&state.db)
        .await?;

    // Set this one as default
    sqlx::query("UPDATE addresses SET is_default = 1 WHERE id = ? AND user_id = ?")
        .bind(&id)
        .bind(&user.id)
        .execute(&state.db)
        .await?;

    // Fetch and return the updated address
    let address = sqlx::query_as::<_, Address>("SELECT * FROM addresses WHERE id = ?")
        .bind(&id)
        .fetch_one(&state.db)
        .await?;

    Ok(Json(address))
}
