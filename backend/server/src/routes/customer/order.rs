use axum::{
    extract::{Path, State},
    routing::{get, post},
    Json, Router,
};
use axum_extra::extract::cookie::CookieJar;

use backend_session::{cookie_name, lookup_subject_id, SessionScope};
use backend_shared::AppError;

use crate::state::AppState;

pub fn router() -> Router<AppState> {
    Router::new()
        .route("/", get(list))
        .route("/checkout", post(checkout))
        .route("/{id}", get(detail))
}

async fn list(
    State(state): State<AppState>,
    jar: CookieJar,
) -> Result<Json<serde_json::Value>, AppError> {
    let user_id = current_user_id(&state, &jar).await?;
    Ok(Json(
        backend_order::list_orders_for_user(&state.db, &user_id).await?,
    ))
}

async fn detail(
    State(state): State<AppState>,
    jar: CookieJar,
    Path(id): Path<String>,
) -> Result<Json<backend_order::OrderDetail>, AppError> {
    let user_id = current_user_id(&state, &jar).await?;
    Ok(Json(
        backend_order::get_order_for_user(&state.db, &user_id, &id).await?,
    ))
}

async fn checkout(
    State(state): State<AppState>,
    jar: CookieJar,
    Json(input): Json<backend_order::CheckoutInput>,
) -> Result<Json<backend_order::CheckoutResult>, AppError> {
    let user_id = current_user_id(&state, &jar).await?;
    Ok(Json(
        backend_order::checkout(&state.db, &user_id, input).await?,
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
