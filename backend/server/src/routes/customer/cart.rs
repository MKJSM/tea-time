use axum::{
    extract::{Path, State},
    routing::{get, patch, post},
    Json, Router,
};
use axum_extra::extract::cookie::CookieJar;

use backend_session::{cookie_name, lookup_subject_id, SessionScope};
use backend_shared::AppError;

use crate::state::AppState;

#[derive(serde::Deserialize)]
struct QuantityInput {
    quantity: i32,
}

pub fn router() -> Router<AppState> {
    Router::new()
        .route("/", get(get_cart))
        .route("/items", post(add_item))
        .route("/items/{id}", patch(update_item).delete(delete_item))
}

async fn get_cart(
    State(state): State<AppState>,
    jar: CookieJar,
) -> Result<Json<backend_order::CartResponse>, AppError> {
    let user_id = current_user_id(&state, &jar).await?;
    Ok(Json(backend_order::get_cart(&state.db, &user_id).await?))
}

async fn add_item(
    State(state): State<AppState>,
    jar: CookieJar,
    Json(input): Json<backend_order::CartItemInput>,
) -> Result<Json<backend_order::CartResponse>, AppError> {
    let user_id = current_user_id(&state, &jar).await?;
    Ok(Json(
        backend_order::add_cart_item(&state.db, &user_id, input).await?,
    ))
}

async fn update_item(
    State(state): State<AppState>,
    jar: CookieJar,
    Path(id): Path<String>,
    Json(input): Json<QuantityInput>,
) -> Result<Json<backend_order::CartResponse>, AppError> {
    let user_id = current_user_id(&state, &jar).await?;
    Ok(Json(
        backend_order::update_cart_item(&state.db, &user_id, &id, input.quantity).await?,
    ))
}

async fn delete_item(
    State(state): State<AppState>,
    jar: CookieJar,
    Path(id): Path<String>,
) -> Result<Json<backend_order::CartResponse>, AppError> {
    let user_id = current_user_id(&state, &jar).await?;
    Ok(Json(
        backend_order::delete_cart_item(&state.db, &user_id, &id).await?,
    ))
}

async fn current_user_id(state: &AppState, jar: &CookieJar) -> Result<String, AppError> {
    let token = jar
        .get(cookie_name(SessionScope::Customer))
        .map(|cookie| cookie.value().to_string())
        .ok_or_else(|| AppError::Unauthorized("customer session is missing".into()))?;
    let user_id = lookup_subject_id(&state.db, SessionScope::Customer, &token)
        .await?
        .ok_or_else(|| AppError::Unauthorized("customer session is invalid".into()))?;
    Ok(user_id.to_string())
}
