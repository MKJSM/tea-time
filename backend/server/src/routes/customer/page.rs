use axum::{extract::State, routing::get, Json, Router};
use backend_shared::AppError;

use crate::state::AppState;

async fn get_page(
    State(state): State<AppState>,
) -> Result<Json<backend_page::PageDocument>, AppError> {
    Ok(Json(backend_page::get_public(&state.db).await?))
}

pub fn router() -> Router<AppState> {
    Router::new().route("/", get(get_page))
}
