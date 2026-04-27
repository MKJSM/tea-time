use axum::{
    extract::State,
    routing::{get, post},
    Json, Router,
};

use backend_page::PageInput;
use backend_shared::AppError;

use crate::state::AppState;

async fn get_page(
    State(state): State<AppState>,
) -> Result<Json<backend_page::PageDocument>, AppError> {
    Ok(Json(backend_page::get_admin(&state.db).await?))
}

async fn save_page(
    State(state): State<AppState>,
    Json(input): Json<PageInput>,
) -> Result<Json<backend_page::PageDocument>, AppError> {
    Ok(Json(backend_page::save(&state.db, input).await?))
}

async fn publish_page(
    State(state): State<AppState>,
) -> Result<Json<backend_page::PageDocument>, AppError> {
    Ok(Json(backend_page::publish(&state.db).await?))
}

async fn unpublish_page(
    State(state): State<AppState>,
) -> Result<Json<backend_page::PageDocument>, AppError> {
    Ok(Json(backend_page::unpublish(&state.db).await?))
}

async fn delete_page(State(state): State<AppState>) -> Result<Json<serde_json::Value>, AppError> {
    backend_page::delete(&state.db).await?;
    Ok(Json(serde_json::json!({ "ok": true })))
}

pub fn router() -> Router<AppState> {
    Router::new()
        .route("/", get(get_page).put(save_page).delete(delete_page))
        .route("/publish", post(publish_page))
        .route("/unpublish", post(unpublish_page))
}
