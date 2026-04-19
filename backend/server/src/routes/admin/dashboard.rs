use axum::{extract::State, Json};

use backend_shared::AppError;

use crate::state::AppState;

pub async fn health(State(state): State<AppState>) -> Result<Json<serde_json::Value>, AppError> {
    let base = backend_admin::health(&state.db).await?;
    let client = state.db.get().await.map_err(backend_shared::map_pool_error_to_app_error)?;
    let products: i64 = client.query_one("SELECT COUNT(*) FROM product", &[]).await?.get(0);
    let categories: i64 = client.query_one("SELECT COUNT(*) FROM category", &[]).await?.get(0);
    let users: i64 = client.query_one("SELECT COUNT(*) FROM \"user\"", &[]).await?.get(0);
    let orders: i64 = client.query_one("SELECT COUNT(*) FROM customer_order", &[]).await?.get(0);
    let paid_payments: i64 = client.query_one("SELECT COUNT(*) FROM payment WHERE status = 'paid'", &[]).await?.get(0);
    Ok(Json(serde_json::json!({
        "ok": base["ok"],
        "scope": "admin",
        "database": base["database"],
        "summary": {
            "products": products,
            "categories": categories,
            "users": users,
            "orders": orders,
            "paid_payments": paid_payments,
        }
    })))
}
