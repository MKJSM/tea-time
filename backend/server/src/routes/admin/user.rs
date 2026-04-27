use axum::{
    extract::{Path, State},
    routing::get,
    Json, Router,
};
use backend_shared::AppError;

use crate::state::AppState;

pub fn router() -> Router<AppState> {
    Router::new()
        .route("/", get(list).post(create))
        .route("/{id}", get(detail))
}

async fn list(State(state): State<AppState>) -> Result<Json<serde_json::Value>, AppError> {
    Ok(Json(backend_customer::list_customers(&state.db).await?))
}

async fn create(
    State(state): State<AppState>,
    Json(input): Json<backend_customer::CreateCustomerInput>,
) -> Result<Json<backend_customer::AuthResponse>, AppError> {
    Ok(Json(
        backend_customer::create_by_admin(&state.db, input).await?,
    ))
}

async fn detail(
    State(state): State<AppState>,
    Path(id): Path<String>,
) -> Result<Json<serde_json::Value>, AppError> {
    let customer = backend_customer::me(
        &state.db,
        uuid::Uuid::parse_str(&id).map_err(|_| AppError::BadRequest("invalid user id".into()))?,
    )
    .await?;
    let addresses = backend_address::list_for_user(&state.db, &id).await?;
    let orders = backend_order::list_orders_for_user(&state.db, &id).await?;
    Ok(Json(
        serde_json::json!({"ok": true, "customer": customer, "addresses": addresses["items"].clone(), "orders": orders["items"].clone()}),
    ))
}
