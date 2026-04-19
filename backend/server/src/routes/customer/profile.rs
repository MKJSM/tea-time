use axum::{extract::State, routing::get, Json, Router};
use axum_extra::extract::cookie::CookieJar;

use backend_session::{cookie_name, lookup_subject_id, SessionScope};
use backend_shared::AppError;

use crate::state::AppState;

pub fn router() -> Router<AppState> {
    Router::new().route("/health", get(health)).route("/profile", get(me).patch(update_profile))
}

async fn health() -> Json<serde_json::Value> {
    Json(backend_customer::customer_health())
}

async fn me(State(state): State<AppState>, jar: CookieJar) -> Result<Json<backend_customer::AuthResponse>, AppError> {
    let user_id = current_user_id(&state, &jar).await?;
    Ok(Json(backend_customer::me(&state.db, user_id).await?))
}

async fn update_profile(
    State(state): State<AppState>,
    jar: CookieJar,
    Json(input): Json<backend_customer::UpdateProfileInput>,
) -> Result<Json<backend_customer::AuthResponse>, AppError> {
    let user_id = current_user_id(&state, &jar).await?;
    Ok(Json(backend_customer::update_profile(&state.db, user_id, input).await?))
}

async fn current_user_id(state: &AppState, jar: &CookieJar) -> Result<uuid::Uuid, AppError> {
    let token = jar
        .get(cookie_name(SessionScope::Customer))
        .map(|cookie| cookie.value().to_string())
        .ok_or_else(|| AppError::Unauthorized("customer session is missing".into()))?;
    lookup_subject_id(&state.db, SessionScope::Customer, &token)
        .await?
        .ok_or_else(|| AppError::Unauthorized("customer session is invalid".into()))
}
