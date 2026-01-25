use crate::auth::RequiredAuthUser;
use crate::domain::models::Product;
use crate::error::AppError;
use crate::state::AppState;
use axum::{
    extract::{Path, State},
    http::StatusCode,
    Json,
};

#[tracing::instrument(skip(state, user))]
pub async fn list_favorites(
    user: RequiredAuthUser,
    State(state): State<AppState>,
) -> Result<Json<Vec<Product>>, AppError> {
    let favorites = sqlx::query_as::<_, Product>(
        r#"
        SELECT p.*
        FROM products p
        JOIN favorites f ON p.id = f.product_id
        WHERE f.user_id = ?
        ORDER BY f.created_at DESC
        "#,
    )
    .bind(&user.id)
    .fetch_all(&state.db)
    .await?;

    Ok(Json(favorites))
}

#[tracing::instrument(skip(state, user))]
pub async fn add_favorite(
    user: RequiredAuthUser,
    State(state): State<AppState>,
    Path(product_id): Path<i32>,
) -> Result<StatusCode, AppError> {
    // Check if product exists first
    let product_exists = sqlx::query("SELECT 1 FROM products WHERE id = ?")
        .bind(product_id)
        .fetch_optional(&state.db)
        .await?;

    if product_exists.is_none() {
        return Err(AppError::NotFound("Product not found".into()));
    }

    // INSERT OR IGNORE handles duplicates gracefully
    sqlx::query("INSERT OR IGNORE INTO favorites (user_id, product_id) VALUES (?, ?)")
        .bind(&user.id)
        .bind(product_id)
        .execute(&state.db)
        .await?;

    Ok(StatusCode::CREATED)
}

#[tracing::instrument(skip(state, user))]
pub async fn remove_favorite(
    user: RequiredAuthUser,
    State(state): State<AppState>,
    Path(product_id): Path<i32>,
) -> Result<StatusCode, AppError> {
    sqlx::query("DELETE FROM favorites WHERE user_id = ? AND product_id = ?")
        .bind(&user.id)
        .bind(product_id)
        .execute(&state.db)
        .await?;

    Ok(StatusCode::NO_CONTENT)
}

#[tracing::instrument(skip(state, user))]
pub async fn get_favorite_ids(
    user: RequiredAuthUser,
    State(state): State<AppState>,
) -> Result<Json<Vec<i32>>, AppError> {
    let ids: Vec<i32> = sqlx::query_scalar("SELECT product_id FROM favorites WHERE user_id = ?")
        .bind(&user.id)
        .fetch_all(&state.db)
        .await?;

    Ok(Json(ids))
}
