use axum::{
    extract::{State, Path},
    http::{StatusCode, HeaderMap},
    Json,
};
use crate::state::AppState;
use crate::domain::models::{Product, User, Session};
use crate::error::AppError;
use sqlx::Row;

// Helper to extract user from token (similar to get_me handler)
// In a real app this would be a middleware or extractor
async fn get_authenticated_user(
    state: &AppState,
    headers: &HeaderMap,
) -> Result<User, AppError> {
    let auth_header = headers.get("Authorization")
        .ok_or_else(|| AppError::Unauthorized("Missing token".into()))?
        .to_str()
        .map_err(|_| AppError::Unauthorized("Invalid token format".into()))?;

    let token = auth_header.strip_prefix("Bearer ").unwrap_or(auth_header);

    let session = sqlx::query_as::<_, Session>("SELECT * FROM sessions WHERE id = ? AND expires_at > CURRENT_TIMESTAMP")
        .bind(token)
        .fetch_optional(&state.db)
        .await?
        .ok_or_else(|| AppError::Unauthorized("Invalid or expired session".into()))?;

    let user = sqlx::query_as::<_, User>("SELECT * FROM users WHERE id = ?")
        .bind(session.user_id)
        .fetch_one(&state.db)
        .await?;

    Ok(user)
}

pub async fn list_favorites(
    State(state): State<AppState>,
    headers: HeaderMap,
) -> Result<Json<Vec<Product>>, AppError> {
    let user = get_authenticated_user(&state, &headers).await?;

    // Join favorites with products to get full product details
    let favorites = sqlx::query_as::<_, Product>(
        r#"
        SELECT p.* 
        FROM products p
        JOIN favorites f ON p.id = f.product_id
        WHERE f.user_id = ?
        ORDER BY f.created_at DESC
        "#
    )
    .bind(user.id)
    .fetch_all(&state.db)
    .await?;

    Ok(Json(favorites))
}

pub async fn add_favorite(
    State(state): State<AppState>,
    headers: HeaderMap,
    Path(product_id): Path<i32>,
) -> Result<StatusCode, AppError> {
    let user = get_authenticated_user(&state, &headers).await?;

    // Check if product exists first
    let product_exists = sqlx::query("SELECT 1 FROM products WHERE id = ?")
        .bind(product_id)
        .fetch_optional(&state.db)
        .await?;

    if product_exists.is_none() {
        return Err(AppError::NotFound("Product not found".into()));
    }

    // Insert ignore/on conflict do nothing to handle duplicates gracefully
    // SQLite uses "INSERT OR IGNORE"
    sqlx::query("INSERT OR IGNORE INTO favorites (user_id, product_id) VALUES (?, ?)")
        .bind(user.id)
        .bind(product_id)
        .execute(&state.db)
        .await?;

    Ok(StatusCode::CREATED)
}

pub async fn remove_favorite(
    State(state): State<AppState>,
    headers: HeaderMap,
    Path(product_id): Path<i32>,
) -> Result<StatusCode, AppError> {
    let user = get_authenticated_user(&state, &headers).await?;

    sqlx::query("DELETE FROM favorites WHERE user_id = ? AND product_id = ?")
        .bind(user.id)
        .bind(product_id)
        .execute(&state.db)
        .await?;

    Ok(StatusCode::NO_CONTENT)
}

// Return list of favorite IDs for the current user (lightweight for frontend initial check)
pub async fn get_favorite_ids(
    State(state): State<AppState>,
    headers: HeaderMap,
) -> Result<Json<Vec<i32>>, AppError> {
    let user = get_authenticated_user(&state, &headers).await?;

    let rows = sqlx::query("SELECT product_id FROM favorites WHERE user_id = ?")
        .bind(user.id)
        .fetch_all(&state.db)
        .await?;

    let ids: Vec<i32> = rows.iter().map(|r| r.get("product_id")).collect();

    Ok(Json(ids))
}
