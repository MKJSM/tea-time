use axum::{extract::{Path, State}, routing::{get, patch}, Json, Router};
use axum_extra::extract::cookie::CookieJar;

use backend_session::{cookie_name, lookup_subject_id, SessionScope};
use backend_shared::AppError;

use crate::state::AppState;

pub fn router() -> Router<AppState> {
    Router::new()
        .route("/", get(list).post(create))
        .route("/:id", patch(update).delete(remove))
}

async fn list(State(state): State<AppState>, jar: CookieJar) -> Result<Json<serde_json::Value>, AppError> {
    let user_id = current_user_id(&state, &jar).await?;
    Ok(Json(backend_address::list_for_user(&state.db, &user_id).await?))
}

async fn create(
    State(state): State<AppState>,
    jar: CookieJar,
    Json(input): Json<backend_address::AddressInput>,
) -> Result<Json<backend_address::Address>, AppError> {
    let user_id = current_user_id(&state, &jar).await?;
    Ok(Json(backend_address::create_for_user(&state.db, &user_id, input).await?))
}

async fn update(
    State(state): State<AppState>,
    jar: CookieJar,
    Path(id): Path<String>,
    Json(input): Json<backend_address::AddressInput>,
) -> Result<Json<backend_address::Address>, AppError> {
    let user_id = current_user_id(&state, &jar).await?;
    Ok(Json(backend_address::update_for_user(&state.db, &user_id, &id, input).await?))
}

async fn remove(
    State(state): State<AppState>,
    jar: CookieJar,
    Path(id): Path<String>,
) -> Result<Json<serde_json::Value>, AppError> {
    let user_id = current_user_id(&state, &jar).await?;
    backend_address::delete_for_user(&state.db, &user_id, &id).await?;
    Ok(Json(serde_json::json!({"ok": true})))
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
