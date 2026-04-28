use backend_shared::{map_pool_error_to_app_error, AppError};
use deadpool_postgres::Pool;
use serde::{Deserialize, Serialize};
use tokio_postgres::Row;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize)]
pub struct PaymentRecord {
    pub id: String,
    pub order_id: String,
    pub user_id: String,
    pub provider: String,
    pub provider_order_id: Option<String>,
    pub provider_payment_id: Option<String>,
    pub status: String,
    pub amount: f64,
    pub currency: String,
    pub failure_reason: Option<String>,
    pub paid_on: Option<String>,
}

#[derive(Debug, Clone, Serialize)]
pub struct InitiatePaymentResponse {
    pub payment_id: String,
    pub order_id: String,
    pub order_number: String,
    pub amount: i64,
    pub amount_major: f64,
    pub currency: String,
    pub provider_order_id: String,
    pub razorpay_key_id: String,
}

#[derive(Debug, Clone)]
pub struct PaymentCheckoutContext {
    pub payment_id: String,
    pub order_id: String,
    pub order_number: String,
    pub amount_major: f64,
    pub amount_minor: i64,
    pub currency: String,
    pub provider_order_id: Option<String>,
    pub payment_status: String,
}

#[derive(Debug, Clone, Deserialize)]
pub struct VerifyPaymentInput {
    pub provider_order_id: String,
    pub provider_payment_id: String,
    pub provider_signature: String,
}

pub async fn attach_provider_order(
    pool: &Pool,
    order_id: &str,
    user_id: &str,
    provider_order_id: &str,
) -> Result<PaymentRecord, AppError> {
    let client = pool.get().await.map_err(map_pool_error_to_app_error)?;
    let row = client
        .query_opt(
            "UPDATE payment
             SET provider_order_id = COALESCE(provider_order_id, $3), modified_on = NOW()
             WHERE order_id = $1::text::uuid AND user_id = $2::text::uuid
             RETURNING id::text, order_id::text, user_id::text, provider, provider_order_id, provider_payment_id, status, amount, currency, failure_reason, paid_on::text",
            &[&order_id, &user_id, &provider_order_id],
        )
        .await?;
    row.map(|row| map_payment(&row))
        .ok_or_else(|| AppError::NotFound("payment not found".into()))
}

pub async fn mark_paid(
    pool: &Pool,
    user_id: &str,
    provider_order_id: &str,
    provider_payment_id: &str,
    provider_signature: Option<&str>,
) -> Result<PaymentRecord, AppError> {
    let mut client = pool.get().await.map_err(map_pool_error_to_app_error)?;
    let tx = client.transaction().await?;
    let payment_row = tx.query_opt(
        "SELECT id::text, order_id::text, user_id::text, provider, provider_order_id, provider_payment_id, provider_signature, status, amount, currency, failure_reason, paid_on::text
         FROM payment WHERE provider_order_id = $1 AND user_id = $2::text::uuid
         FOR UPDATE",
        &[&provider_order_id, &user_id]
    ).await?;
    let payment_row = payment_row.ok_or_else(|| AppError::NotFound("payment not found".into()))?;
    let order_id: String = payment_row.get(1);
    let payment_id: String = payment_row.get(0);
    let current_status: String = payment_row.get(7);
    let existing_payment_id: Option<String> = payment_row.get(5);

    if current_status == "paid" {
        if existing_payment_id.as_deref() != Some(provider_payment_id)
            && existing_payment_id.is_some()
        {
            return Err(AppError::Conflict("payment already verified for a different provider payment".into()));
        }
        tx.commit().await?;
        return get_by_provider_order(pool, provider_order_id).await;
    }

    tx.execute(
        "UPDATE payment
         SET provider_payment_id = COALESCE(provider_payment_id, $2),
             provider_signature = COALESCE(provider_signature, $3),
             status = 'paid',
             paid_on = COALESCE(paid_on, NOW()),
             modified_on = NOW()
         WHERE id = $1::text::uuid",
        &[&payment_id, &provider_payment_id, &provider_signature],
    )
    .await?;
    tx.execute(
        "UPDATE customer_order
         SET payment_status = 'paid', status = 'paid', modified_on = NOW()
         WHERE id = $1::text::uuid AND payment_status <> 'paid'",
        &[&order_id],
    )
    .await?;
    tx.execute(
        "INSERT INTO payment_event (id, payment_id, provider_event_id, event_type, payload_json)
         VALUES ($1::text::uuid, $2::text::uuid, $3, 'payment.verified', $4::jsonb)",
        &[
            &Uuid::new_v4().to_string(),
            &payment_id,
            &provider_payment_id,
            &serde_json::json!({
                "provider_order_id": provider_order_id,
                "provider_payment_id": provider_payment_id,
                "provider_signature": provider_signature,
            })
            .to_string(),
        ],
    )
    .await?;
    tx.commit().await?;
    get_by_provider_order(pool, provider_order_id).await
}

pub async fn mark_failed(
    pool: &Pool,
    provider_order_id: &str,
    reason: &str,
    event_type: &str,
    payload: serde_json::Value,
) -> Result<(), AppError> {
    let mut client = pool.get().await.map_err(map_pool_error_to_app_error)?;
    let payment = client
        .query_opt(
            "SELECT id::text, order_id::text, status FROM payment WHERE provider_order_id = $1",
            &[&provider_order_id],
        )
        .await?;
    let Some(payment) = payment else {
        return Ok(());
    };
    let payment_id: String = payment.get(0);
    let order_id: String = payment.get(1);
    let current_status: String = payment.get(2);
    if current_status == "paid" || current_status == "failed" {
        return Ok(());
    }
    let tx = client.transaction().await?;
    tx.execute(
        "UPDATE payment SET status = 'failed', failure_reason = $2, modified_on = NOW()
         WHERE id = $1::text::uuid",
        &[&payment_id, &reason],
    )
    .await?;
    tx.execute(
        "UPDATE customer_order SET payment_status = 'failed', modified_on = NOW()
         WHERE id = $1::text::uuid",
        &[&order_id],
    )
    .await?;
    tx.execute(
        "INSERT INTO payment_event (id, payment_id, provider_event_id, event_type, payload_json)
         VALUES ($1::text::uuid, $2::text::uuid, NULL, $3, $4::jsonb)",
        &[
            &Uuid::new_v4().to_string(),
            &payment_id,
            &event_type,
            &payload.to_string(),
        ],
    )
    .await?;
    tx.commit().await?;
    Ok(())
}

pub async fn list_admin(pool: &Pool) -> Result<serde_json::Value, AppError> {
    let client = pool.get().await.map_err(map_pool_error_to_app_error)?;
    let rows = client.query(
        "SELECT id::text, order_id::text, user_id::text, provider, provider_order_id, provider_payment_id, status, amount, currency, failure_reason, paid_on::text
         FROM payment ORDER BY created_on DESC",
        &[]
    ).await?;
    Ok(serde_json::json!({"ok": true, "items": rows.iter().map(map_payment).collect::<Vec<_>>()}))
}

pub async fn get_admin(pool: &Pool, payment_id: &str) -> Result<serde_json::Value, AppError> {
    let client = pool.get().await.map_err(map_pool_error_to_app_error)?;
    let row = client.query_opt(
        "SELECT id::text, order_id::text, user_id::text, provider, provider_order_id, provider_payment_id, status, amount, currency, failure_reason, paid_on::text
         FROM payment WHERE id = $1::text::uuid",
        &[&payment_id]
    ).await?;
    let payment = row
        .map(|row| map_payment(&row))
        .ok_or_else(|| AppError::NotFound("payment not found".into()))?;
    let events = client
        .query(
            "SELECT id::text, provider_event_id, event_type, payload_json::text, created_on::text
         FROM payment_event WHERE payment_id = $1::text::uuid ORDER BY created_on DESC",
            &[&payment_id],
        )
        .await?;
    Ok(serde_json::json!({
        "ok": true,
        "item": payment,
        "events": events.iter().map(|row| serde_json::json!({
            "id": row.get::<_, String>(0),
            "provider_event_id": row.get::<_, Option<String>>(1),
            "event_type": row.get::<_, String>(2),
            "payload_json": row.get::<_, String>(3),
            "created_on": row.get::<_, String>(4),
        })).collect::<Vec<_>>()
    }))
}

pub async fn get_checkout_context(
    pool: &Pool,
    order_id: &str,
    user_id: &str,
) -> Result<PaymentCheckoutContext, AppError> {
    let client = pool.get().await.map_err(map_pool_error_to_app_error)?;
    let row = client.query_opt(
        "SELECT p.id::text, co.id::text, co.order_number, co.total_amount, co.currency, p.provider_order_id, p.status
         FROM payment p JOIN customer_order co ON co.id = p.order_id
         WHERE co.id = $1::text::uuid AND co.user_id = $2::text::uuid",
        &[&order_id, &user_id]
    ).await?;
    let row = row.ok_or_else(|| AppError::NotFound("payment context not found".into()))?;
    Ok(PaymentCheckoutContext {
        payment_id: row.get(0),
        order_id: row.get(1),
        order_number: row.get(2),
        amount_major: row.get(3),
        amount_minor: ((row.get::<_, f64>(3)) * 100.0).round() as i64,
        currency: row.get(4),
        provider_order_id: row.get(5),
        payment_status: row.get(6),
    })
}

pub async fn get_by_provider_order(
    pool: &Pool,
    provider_order_id: &str,
) -> Result<PaymentRecord, AppError> {
    let client = pool.get().await.map_err(map_pool_error_to_app_error)?;
    let row = client.query_opt(
        "SELECT id::text, order_id::text, user_id::text, provider, provider_order_id, provider_payment_id, status, amount, currency, failure_reason, paid_on::text
         FROM payment WHERE provider_order_id = $1",
        &[&provider_order_id]
    ).await?;
    row.map(|row| map_payment(&row))
        .ok_or_else(|| AppError::NotFound("payment not found".into()))
}

fn map_payment(row: &Row) -> PaymentRecord {
    PaymentRecord {
        id: row.get(0),
        order_id: row.get(1),
        user_id: row.get(2),
        provider: row.get(3),
        provider_order_id: row.get(4),
        provider_payment_id: row.get(5),
        status: row.get(6),
        amount: row.get(7),
        currency: row.get(8),
        failure_reason: row.get(9),
        paid_on: row.get(10),
    }
}
