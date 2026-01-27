use crate::auth::RequiredAuthUser;
use crate::domain::models::Product;
use crate::error::AppError;
use crate::state::AppState;
use axum::{
    extract::{Path, State},
    http::StatusCode,
    Json,
};
use uuid::Uuid;

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
        WHERE f.user_id = $1
        ORDER BY f.created_at DESC
        "#,
    )
    .bind(user.id)
    .fetch_all(&state.db)
    .await?;

    Ok(Json(favorites))
}

#[tracing::instrument(skip(state, user))]
pub async fn add_favorite(
    user: RequiredAuthUser,
    State(state): State<AppState>,
    Path(product_id): Path<Uuid>,
) -> Result<StatusCode, AppError> {
    // Check if product exists first
    let product_exists = sqlx::query("SELECT 1 FROM products WHERE id = $1")
        .bind(product_id)
        .fetch_optional(&state.db)
        .await?;

    if product_exists.is_none() {
        return Err(AppError::NotFound("Product not found".into()));
    }

    // INSERT INTO ... ON CONFLICT DO NOTHING for Postgres
    sqlx::query("INSERT INTO favorites (user_id, product_id) VALUES ($1, $2) ON CONFLICT (user_id, product_id) DO NOTHING")
        .bind(user.id)
        .bind(product_id)
        .execute(&state.db)
        .await?;

    Ok(StatusCode::CREATED)
}

#[tracing::instrument(skip(state, user))]
pub async fn remove_favorite(
    user: RequiredAuthUser,
    State(state): State<AppState>,
    Path(product_id): Path<Uuid>,
) -> Result<StatusCode, AppError> {
    sqlx::query("DELETE FROM favorites WHERE user_id = $1 AND product_id = $2")
        .bind(user.id)
        .bind(product_id)
        .execute(&state.db)
        .await?;

    Ok(StatusCode::NO_CONTENT)
}

#[tracing::instrument(skip(state, user))]
pub async fn get_favorite_ids(
    user: RequiredAuthUser,
    State(state): State<AppState>,
) -> Result<Json<Vec<Uuid>>, AppError> {
    let ids: Vec<Uuid> = sqlx::query_scalar("SELECT product_id FROM favorites WHERE user_id = $1")
        .bind(user.id)
        .fetch_all(&state.db)
        .await?;

    Ok(Json(ids))
}
