use axum::{
    extract::State,
    http::HeaderMap,
    routing::{get, post},
    Json, Router,
};
use axum_extra::extract::cookie::CookieJar;
use hmac::{Hmac, Mac};
use reqwest::StatusCode;
use sha2::Sha256;

use backend_session::{cookie_name, lookup_subject_id, SessionScope};
use backend_shared::AppError;

use crate::state::AppState;

type HmacSha256 = Hmac<Sha256>;

#[derive(serde::Deserialize)]
pub struct InitiateInput {
    pub order_id: String,
}

pub fn router() -> Router<AppState> {
    Router::new()
        .route("/razorpay/order", post(initiate_razorpay_order))
        .route("/razorpay/verify", post(verify_payment))
        .route("/webhooks/razorpay", post(handle_webhook))
        .route("/", get(list_forbidden))
}

async fn list_forbidden() -> Result<Json<serde_json::Value>, AppError> {
    Err(AppError::NotFound("not found".into()))
}

async fn initiate_razorpay_order(
    State(state): State<AppState>,
    jar: CookieJar,
    Json(input): Json<InitiateInput>,
) -> Result<Json<backend_payment::InitiatePaymentResponse>, AppError> {
    let _user_id = current_user_id(&state, &jar).await?;
    let mut response = backend_payment::get_checkout_context(&state.db, &input.order_id).await?;
    let payload = serde_json::json!({
        "amount": response.amount,
        "currency": response.currency,
        "receipt": response.order_number,
    });
    let razorpay_response = state
        .http_client
        .post("https://api.razorpay.com/v1/orders")
        .basic_auth(&state.razorpay.key_id, Some(&state.razorpay.key_secret))
        .json(&payload)
        .send()
        .await
        .map_err(|error| AppError::Config(format!("failed to create razorpay order: {error}")))?;
    if razorpay_response.status() != StatusCode::OK
        && razorpay_response.status() != StatusCode::CREATED
    {
        let body = razorpay_response.text().await.unwrap_or_default();
        return Err(AppError::Config(format!(
            "razorpay order creation failed: {body}"
        )));
    }
    let body: serde_json::Value = razorpay_response
        .json()
        .await
        .map_err(|error| AppError::Config(format!("invalid razorpay response: {error}")))?;
    let provider_order_id = body
        .get("id")
        .and_then(|value| value.as_str())
        .ok_or_else(|| AppError::Config("razorpay order id missing".into()))?
        .to_string();
    let payment =
        backend_payment::attach_provider_order(&state.db, &input.order_id, &provider_order_id)
            .await?;
    response.provider_order_id = payment.provider_order_id.unwrap_or(provider_order_id);
    response.razorpay_key_id = state.razorpay.key_id.clone();
    Ok(Json(response))
}

async fn verify_payment(
    State(state): State<AppState>,
    jar: CookieJar,
    Json(input): Json<backend_payment::VerifyPaymentInput>,
) -> Result<Json<backend_payment::PaymentRecord>, AppError> {
    let user_id = current_user_id(&state, &jar).await?;
    let payload = format!("{}|{}", input.provider_order_id, input.provider_payment_id);
    let mut mac = HmacSha256::new_from_slice(state.razorpay.key_secret.as_bytes())
        .map_err(|error| AppError::Config(format!("failed to build hmac: {error}")))?;
    mac.update(payload.as_bytes());
    let expected = hex::encode(mac.finalize().into_bytes());
    if expected != input.provider_signature {
        return Err(AppError::BadRequest("invalid payment signature".into()));
    }
    let payment = backend_payment::mark_paid(
        &state.db,
        &input.provider_order_id,
        &input.provider_payment_id,
        &input.provider_signature,
    )
    .await?;
    backend_order::clear_cart_by_user(&state.db, &user_id).await?;
    Ok(Json(payment))
}

async fn handle_webhook(
    State(state): State<AppState>,
    headers: HeaderMap,
    body: String,
) -> Result<Json<serde_json::Value>, AppError> {
    let signature = headers
        .get("x-razorpay-signature")
        .or_else(|| headers.get("X-Razorpay-Signature"))
        .and_then(|header| header.to_str().ok())
        .ok_or_else(|| AppError::BadRequest("Missing signature".into()))?;

    let mut mac = HmacSha256::new_from_slice(state.razorpay.webhook_secret.as_bytes())
        .map_err(|error| AppError::Config(format!("failed to build webhook hmac: {error}")))?;
    mac.update(body.as_bytes());
    let expected = hex::encode(mac.finalize().into_bytes());
    if expected != signature {
        return Err(AppError::BadRequest("Invalid signature".into()));
    }

    let payload: serde_json::Value = serde_json::from_str(&body)
        .map_err(|error| AppError::BadRequest(format!("Invalid payload: {error}")))?;
    let event_type = payload
        .get("event")
        .and_then(|value| value.as_str())
        .unwrap_or("unknown");
    let provider_order_id = payload
        .pointer("/payload/payment/entity/order_id")
        .and_then(|value| value.as_str())
        .or_else(|| {
            payload
                .pointer("/payload/order/entity/id")
                .and_then(|value| value.as_str())
        });

    if let Some(provider_order_id) = provider_order_id {
        match event_type {
            "payment.captured" | "order.paid" => {
                if let Some(provider_payment_id) = payload
                    .pointer("/payload/payment/entity/id")
                    .and_then(|value| value.as_str())
                {
                    let signature = payload
                        .pointer("/payload/payment/entity/id")
                        .and_then(|value| value.as_str())
                        .unwrap_or_default();
                    let payment = backend_payment::mark_paid(
                        &state.db,
                        provider_order_id,
                        provider_payment_id,
                        signature,
                    )
                    .await?;
                    backend_order::clear_cart_by_user(&state.db, &payment.user_id).await?;
                }
            }
            "payment.failed" => {
                let reason = payload
                    .pointer("/payload/payment/entity/error_description")
                    .and_then(|value| value.as_str())
                    .unwrap_or("payment failed");
                backend_payment::mark_failed(
                    &state.db,
                    provider_order_id,
                    reason,
                    event_type,
                    payload.clone(),
                )
                .await?;
            }
            _ => {}
        }
    }
    Ok(Json(serde_json::json!({"ok": true, "event": event_type})))
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
