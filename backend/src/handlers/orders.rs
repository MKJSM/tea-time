use crate::auth::RequiredAuthUser;
use crate::domain::order::{
    AddressSnapshotDto, CancelOrderRequest, CreateOrderRequest, InitiatePaymentResponse,
    OrderDetailDto, OrderItemCustomizationDto, OrderItemDto, OrderListQuery, OrderStatus,
    OrderSummaryDto, OrderTimelineEventDto, PaymentDto, PaymentHistoryDto, PaymentHistoryListDto,
    PaymentHistoryQuery, PaymentPrefillDto, PaymentVerificationResponse, RazorpayOrderEntity,
    RazorpayPaymentEntity, RazorpayRefundEntity, RazorpayWebhookPayload, VerifyPaymentRequest,
};
use crate::error::AppError;
use crate::state::AppState;
use axum::{
    extract::{Path, Query, State},
    http::{HeaderMap, StatusCode},
    Json,
};
use hmac::{Hmac, Mac};
use sha2::Sha256;
use sqlx::{PgPool, Row};
use std::str::FromStr;
use subtle::ConstantTimeEq;
use uuid::Uuid;
use validator::Validate;

type HmacSha256 = Hmac<Sha256>;

// ============================================================================
// WEBHOOK HANDLER
// ============================================================================

fn scrub_razorpay_payload(mut payload: serde_json::Value) -> serde_json::Value {
    if let Some(obj) = payload.as_object_mut() {
        if let Some(p) = obj.get_mut("payload") {
            if let Some(inner) = p.as_object_mut() {
                for key in ["payment", "order", "refund"] {
                    if let Some(entity_wrapper) = inner.get_mut(key) {
                        if let Some(entity) = entity_wrapper.get_mut("entity") {
                            if let Some(entity_obj) = entity.as_object_mut() {
                                entity_obj.remove("contact");
                                entity_obj.remove("email");
                                entity_obj.remove("customer_id");
                            }
                        }
                    }
                }
            }
        }
    }
    payload
}

/// Handle Razorpay Webhooks
/// POST /api/webhooks/razorpay
pub async fn handle_razorpay_webhook(
    State(state): State<AppState>,
    headers: HeaderMap,
    body: String,
) -> Result<StatusCode, AppError> {
    tracing::info!("Received Razorpay Webhook");

    // 1. Get signature from headers
    let signature = headers
        .get("x-razorpay-signature")
        .or_else(|| headers.get("X-Razorpay-Signature"))
        .and_then(|h| h.to_str().ok())
        .ok_or_else(|| {
            tracing::error!("Missing X-Razorpay-Signature header");
            AppError::BadRequest("Missing signature".into())
        })?;

    // 2. Verify signature
    if !verify_webhook_signature(&body, signature, &state.razorpay.webhook_secret) {
        tracing::error!("Invalid webhook signature");
        return Err(AppError::BadRequest("Invalid signature".into()));
    }

    // 3. Parse payload
    let raw_payload: serde_json::Value = serde_json::from_str(&body).map_err(|e| {
        tracing::error!("Failed to parse webhook payload: {}", e);
        AppError::BadRequest("Invalid payload".into())
    })?;

    let scrubbed_payload = scrub_razorpay_payload(raw_payload.clone());
    let payload: RazorpayWebhookPayload = serde_json::from_value(raw_payload).map_err(|e| {
        tracing::error!("Failed to parse webhook payload into DTO: {}", e);
        AppError::BadRequest("Invalid payload format".into())
    })?;

    tracing::info!("Handling Razorpay event: {}", payload.event);

    let pool = &state.db;

    match payload.event.as_str() {
        "payment.authorized" => {
            if let Some(payment_data) = payload.payload.payment {
                let entity = payment_data.entity;
                handle_payment_authorized(pool, &entity, Some(scrubbed_payload)).await?;
            }
        }
        "payment.captured" => {
            if let Some(payment_data) = payload.payload.payment {
                let entity = payment_data.entity;
                handle_payment_captured(pool, &entity, Some(scrubbed_payload)).await?;
            }
        }
        "payment.failed" => {
            if let Some(payment_data) = payload.payload.payment {
                let entity = payment_data.entity;
                handle_payment_failed(pool, &entity, Some(scrubbed_payload)).await?;
            }
        }
        "order.paid" => {
            if let Some(order_data) = payload.payload.order {
                let entity = order_data.entity;
                handle_order_paid(pool, &entity, Some(scrubbed_payload)).await?;
            }
        }
        "refund.created" => {
            if let Some(refund_data) = payload.payload.refund {
                let entity = refund_data.entity;
                handle_refund_created_from_refund(pool, &entity, Some(scrubbed_payload)).await?;
            } else if let Some(payment_data) = payload.payload.payment {
                let entity = payment_data.entity;
                handle_refund_created(pool, &entity, Some(scrubbed_payload)).await?;
            }
        }
        _ => {
            tracing::debug!("Unhandled Razorpay event: {}", payload.event);
        }
    }

    Ok(StatusCode::OK)
}

fn verify_webhook_signature(body: &str, signature: &str, secret: &str) -> bool {
    let mut mac =
        HmacSha256::new_from_slice(secret.as_bytes()).expect("HMAC can take key of any size");
    mac.update(body.as_bytes());

    let expected = hex::encode(mac.finalize().into_bytes());
    // Use constant-time comparison to prevent timing attacks
    expected.as_bytes().ct_eq(signature.as_bytes()).into()
}

async fn handle_payment_authorized(
    pool: &PgPool,
    entity: &RazorpayPaymentEntity,
    raw_payload: Option<serde_json::Value>,
) -> Result<(), AppError> {
    let razorpay_order_id = &entity.order_id;
    let razorpay_payment_id = &entity.id;

    sqlx::query(
        r#"
        UPDATE payments 
        SET status = 'authorized', razorpay_payment_id = $1, method = $2, 
            webhook_verified = TRUE, webhook_received_at = NOW(), razorpay_webhook_payload = $3 
        WHERE razorpay_order_id = $4 AND status = 'pending'
        "#,
    )
    .bind(razorpay_payment_id)
    .bind(&entity.method)
    .bind(raw_payload)
    .bind(razorpay_order_id)
    .execute(pool)
    .await?;

    tracing::info!("Payment authorized via webhook: {}", razorpay_order_id);
    Ok(())
}

async fn handle_payment_captured(
    pool: &PgPool,
    entity: &RazorpayPaymentEntity,
    raw_payload: Option<serde_json::Value>,
) -> Result<(), AppError> {
    let razorpay_order_id = &entity.order_id;
    let razorpay_payment_id = &entity.id;

    // Find payment record and user_id
    let payment =
        sqlx::query("SELECT p.id, p.order_id, p.status, o.user_id FROM payments p JOIN orders o ON p.order_id = o.id WHERE p.razorpay_order_id = $1")
            .bind(razorpay_order_id)
            .fetch_optional(pool)
            .await?;

    if let Some(p) = payment {
        let payment_id: Uuid = p.try_get("id")?;
        let order_id: Uuid = p.try_get("order_id")?;
        let current_status: String = p.try_get("status")?;
        let user_id: Uuid = p.try_get("user_id")?;

        if current_status == "captured" {
            return Ok(()); // Already processed
        }

        let mut tx = pool.begin().await?;

        // Update payment
        sqlx::query(
            r#"
            UPDATE payments 
            SET status = 'captured', razorpay_payment_id = $1, method = $2, 
                webhook_verified = TRUE, webhook_received_at = NOW(), razorpay_webhook_payload = $3 
            WHERE id = $4
            "#,
        )
        .bind(razorpay_payment_id)
        .bind(&entity.method)
        .bind(raw_payload)
        .bind(payment_id)
        .execute(&mut *tx)
        .await?;

        // Update order
        sqlx::query("UPDATE orders SET status = 'confirmed', confirmed_at = NOW() WHERE id = $1 AND status = 'pending'")
            .bind(order_id)
            .execute(&mut *tx)
            .await?;

        // Record history
        sqlx::query(
            "INSERT INTO order_status_history (id, order_id, from_status, to_status, notes) VALUES ($1, $2, 'pending', 'confirmed', 'Payment captured via webhook')"
        )
        .bind(Uuid::new_v4())
        .bind(order_id)
        .execute(&mut *tx)
        .await?;

        // Clear user cart
        sqlx::query("DELETE FROM cart_items WHERE cart_id = (SELECT id FROM carts WHERE user_id = $1)")
            .bind(user_id)
            .execute(&mut *tx)
            .await?;

        tx.commit().await?;
        tracing::info!(
            "Payment captured and order confirmed via webhook: {}",
            razorpay_order_id
        );
    }

    Ok(())
}

async fn handle_order_paid(
    pool: &PgPool,
    entity: &RazorpayOrderEntity,
    _raw_payload: Option<serde_json::Value>,
) -> Result<(), AppError> {
    let razorpay_order_id = &entity.id;

    // Find our order
    let order = sqlx::query("SELECT id, user_id, status FROM orders WHERE id = (SELECT order_id FROM payments WHERE razorpay_order_id = $1 LIMIT 1)")
        .bind(razorpay_order_id)
        .fetch_optional(pool)
        .await?;

    if let Some(o) = order {
        let order_id: Uuid = o.try_get("id")?;
        let user_id: Uuid = o.try_get("user_id")?;
        let status: String = o.try_get("status")?;

        if status == "pending" {
            let mut tx = pool.begin().await?;

            sqlx::query(
                "UPDATE orders SET status = 'confirmed', confirmed_at = NOW() WHERE id = $1",
            )
            .bind(order_id)
            .execute(&mut *tx)
            .await?;

            sqlx::query(
                "INSERT INTO order_status_history (id, order_id, from_status, to_status, notes) VALUES ($1, $2, 'pending', 'confirmed', 'Order paid via webhook')"
            )
            .bind(Uuid::new_v4())
            .bind(order_id)
            .execute(&mut *tx)
            .await?;

            // Clear user cart
            sqlx::query("DELETE FROM cart_items WHERE cart_id = (SELECT id FROM carts WHERE user_id = $1)")
                .bind(user_id)
                .execute(&mut *tx)
                .await?;

            tx.commit().await?;
            tracing::info!(
                "Order marked as confirmed via order.paid webhook: {}",
                razorpay_order_id
            );
        }
    }

    Ok(())
}

async fn handle_payment_failed(
    pool: &PgPool,
    entity: &RazorpayPaymentEntity,
    raw_payload: Option<serde_json::Value>,
) -> Result<(), AppError> {
    let razorpay_order_id = &entity.order_id;

    sqlx::query(
        r#"
        UPDATE payments 
        SET status = 'failed', error_code = $1, error_description = $2, 
            webhook_verified = TRUE, webhook_received_at = NOW(), razorpay_webhook_payload = $3 
        WHERE razorpay_order_id = $4
        "#,
    )
    .bind(&entity.error_code)
    .bind(&entity.error_description)
    .bind(raw_payload)
    .bind(razorpay_order_id)
    .execute(pool)
    .await?;

    tracing::info!(
        "Payment marked as failed via webhook: {}",
        razorpay_order_id
    );
    Ok(())
}

async fn handle_refund_created_from_refund(
    pool: &PgPool,
    entity: &RazorpayRefundEntity,
    raw_payload: Option<serde_json::Value>,
) -> Result<(), AppError> {
    let razorpay_payment_id = &entity.payment_id;
    let refund_id = &entity.id;
    let amount = entity.amount as f64 / 100.0;

    // Find payment by payment_id
    let payment = sqlx::query("SELECT id FROM payments WHERE razorpay_payment_id = $1")
        .bind(razorpay_payment_id)
        .fetch_optional(pool)
        .await?;

    if let Some(p) = payment {
        let payment_id: Uuid = p.try_get("id")?;

        sqlx::query(
            r#"
            UPDATE payments 
            SET status = 'refunded', refunded_at = NOW(), refund_id = $1, 
                refund_amount = $2, refund_status = 'processed',
                webhook_verified = TRUE, webhook_received_at = NOW(), razorpay_webhook_payload = $3 
            WHERE id = $4
            "#,
        )
        .bind(refund_id)
        .bind(amount)
        .bind(raw_payload)
        .bind(payment_id)
        .execute(pool)
        .await?;

        tracing::info!(
            "Payment marked as refunded via webhook (refund entity): {}",
            razorpay_payment_id
        );
    }

    Ok(())
}

async fn handle_refund_created(
    pool: &PgPool,
    entity: &RazorpayPaymentEntity,
    raw_payload: Option<serde_json::Value>,
) -> Result<(), AppError> {
    let razorpay_payment_id = &entity.id;

    // Find payment by payment_id
    let payment = sqlx::query("SELECT id, order_id FROM payments WHERE razorpay_payment_id = $1")
        .bind(razorpay_payment_id)
        .fetch_optional(pool)
        .await?;

    if let Some(p) = payment {
        let payment_id: Uuid = p.try_get("id")?;

        sqlx::query(
            r#"
            UPDATE payments 
            SET status = 'refunded', refunded_at = NOW(), 
                webhook_verified = TRUE, webhook_received_at = NOW(), razorpay_webhook_payload = $1 
            WHERE id = $2
            "#,
        )
        .bind(raw_payload)
        .bind(payment_id)
        .execute(pool)
        .await?;

        tracing::info!(
            "Payment marked as refunded via webhook: {}",
            razorpay_payment_id
        );
    }

    Ok(())
}

// ============================================================================
// ORDER CREATION
// ============================================================================

/// Create a new order from the user's cart
/// POST /api/orders
pub async fn create_order(
    auth_user: RequiredAuthUser,
    State(state): State<AppState>,
    Json(payload): Json<CreateOrderRequest>,
) -> Result<Json<OrderDetailDto>, AppError> {
    payload
        .validate()
        .map_err(|e| AppError::BadRequest(e.to_string()))?;

    let user_id = auth_user.0.id;
    let pool = &state.db;

    // 1. Verify address belongs to user
    let _address = sqlx::query("SELECT * FROM addresses WHERE id = $1 AND user_id = $2")
        .bind(payload.address_id)
        .bind(user_id)
        .fetch_optional(pool)
        .await?
        .ok_or(AppError::NotFound("Address not found".into()))?;

    // 2. Get user's cart with items
    let cart_row = sqlx::query("SELECT id FROM carts WHERE user_id = $1")
        .bind(user_id)
        .fetch_optional(pool)
        .await?
        .ok_or(AppError::BadRequest("Cart is empty".into()))?;

    let cart_id: Uuid = cart_row.try_get("id")?;

    // 3. Fetch cart items with product details including stock and active status
    let cart_items = sqlx::query(
        r#"
        SELECT ci.id, ci.product_id, ci.quantity, p.name, p.base_price, p.image_urls,
               p.is_active, p.stock_quantity
        FROM cart_items ci
        JOIN products p ON ci.product_id = p.id
        WHERE ci.cart_id = $1
        "#,
    )
    .bind(cart_id)
    .fetch_all(pool)
    .await?;

    if cart_items.is_empty() {
        return Err(AppError::BadRequest("Cart is empty".into()));
    }

    // 3a. Validate all products are available and in stock
    for item in &cart_items {
        let product_name: String = item.try_get("name")?;
        let is_active: bool = item.try_get("is_active")?;
        let stock_quantity: i32 = item.try_get("stock_quantity")?;
        let requested_quantity: i32 = item.try_get("quantity")?;

        if !is_active {
            return Err(AppError::BadRequest(format!(
                "Product '{}' is no longer available",
                product_name
            )));
        }

        if stock_quantity < requested_quantity {
            return Err(AppError::BadRequest(format!(
                "Insufficient stock for '{}'. Available: {}, Requested: {}",
                product_name, stock_quantity, requested_quantity
            )));
        }
    }

    // Batch fetch customizations to avoid N+1
    let cart_item_ids: Vec<Uuid> = cart_items.iter().map(|r| r.get("id")).collect();

    let all_customizations = sqlx::query(
        r#"
        SELECT cic.cart_item_id, cic.group_id, cic.option_id, cic.price_modifier,
               cg.name as group_name, co.name as option_name
        FROM cart_item_customizations cic
        JOIN customization_groups cg ON cic.group_id = cg.id
        JOIN customization_options co ON cic.option_id = co.id
        WHERE cic.cart_item_id = ANY($1)
        "#,
    )
    .bind(&cart_item_ids)
    .fetch_all(pool)
    .await?;

    // Group customizations by cart_item_id
    let mut customs_by_item: std::collections::HashMap<Uuid, Vec<sqlx::postgres::PgRow>> =
        std::collections::HashMap::new();
    for cust in all_customizations {
        let item_id: Uuid = cust.get("cart_item_id");
        customs_by_item.entry(item_id).or_default().push(cust);
    }

    // 4. Calculate totals
    let mut subtotal = 0.0;
    let mut order_items_data = Vec::new();

    for item in &cart_items {
        let item_id: Uuid = item.try_get("id")?;
        let product_id: Uuid = item.try_get("product_id")?;
        let product_name: String = item.try_get("name")?;
        let product_image_urls: Vec<String> = item.try_get("image_urls")?;
        let quantity: i32 = item.try_get("quantity")?;
        let unit_price: f64 = item.try_get("base_price")?;

        // Get customizations from map
        let customizations = customs_by_item.remove(&item_id).unwrap_or_default();

        let customization_price: f64 = customizations
            .iter()
            .map(|c| c.try_get::<f64, _>("price_modifier").unwrap_or(0.0))
            .sum();

        let total_price = (unit_price + customization_price) * quantity as f64;
        subtotal += total_price;

        order_items_data.push((
            product_id,
            product_name,
            product_image_urls,
            quantity,
            unit_price,
            customization_price,
            total_price,
            customizations,
        ));
    }

    // Calculate taxes and delivery
    let tax_rate = 0.05; // 5% each for CGST and SGST
    let tax_cgst = subtotal * tax_rate;
    let tax_sgst = subtotal * tax_rate;
    let delivery_charge = 30.0; // Fixed delivery charge
    let discount = 0.0;
    let total_amount = subtotal + tax_cgst + tax_sgst + delivery_charge - discount;

    // 5. Generate order number
    let order_number: String = sqlx::query_scalar("SELECT generate_order_number()")
        .fetch_one(pool)
        .await?;

    // 6. Create order in transaction
    let mut tx = pool.begin().await?;

    // Cancel existing pending orders to release stock and prevent duplicates
    let pending_orders = sqlx::query("SELECT id FROM orders WHERE user_id = $1 AND status = 'pending'")
        .bind(user_id)
        .fetch_all(&mut *tx)
        .await?;

    for row in pending_orders {
        let p_order_id: Uuid = row.try_get("id")?;

        // Update status
        sqlx::query(
            "UPDATE orders SET status = 'cancelled', cancelled_at = NOW(), cancellation_reason = 'Replaced by new order' WHERE id = $1"
        )
        .bind(p_order_id)
        .execute(&mut *tx)
        .await?;

        // Restore stock
        let items = sqlx::query("SELECT product_id, quantity FROM order_items WHERE order_id = $1")
            .bind(p_order_id)
            .fetch_all(&mut *tx)
            .await?;

        for item in items {
            let pid: Option<Uuid> = item.try_get("product_id")?;
            let qty: i32 = item.try_get("quantity")?;
            if let Some(p) = pid {
                sqlx::query("UPDATE products SET stock_quantity = stock_quantity + $1 WHERE id = $2")
                    .bind(qty)
                    .bind(p)
                    .execute(&mut *tx)
                    .await?;
            }
        }

        // Record status change
        sqlx::query(
            "INSERT INTO order_status_history (id, order_id, from_status, to_status, notes) VALUES ($1, $2, 'pending', 'cancelled', 'Auto-cancelled by new order')"
        )
        .bind(Uuid::new_v4())
        .bind(p_order_id)
        .execute(&mut *tx)
        .await?;
    }

    let order_id = Uuid::new_v4();
    sqlx::query(
        r#"
        INSERT INTO orders (
            id, user_id, address_id, order_number, status,
            subtotal, tax_cgst, tax_sgst, delivery_charge, discount, total_amount, notes
        ) VALUES ($1, $2, $3, $4, 'pending', $5, $6, $7, $8, $9, $10, $11)
        "#,
    )
    .bind(order_id)
    .bind(user_id)
    .bind(payload.address_id)
    .bind(&order_number)
    .bind(subtotal)
    .bind(tax_cgst)
    .bind(tax_sgst)
    .bind(delivery_charge)
    .bind(discount)
    .bind(total_amount)
    .bind(&payload.notes)
    .execute(&mut *tx)
    .await?;

    // 7. Create order items
    for (
        product_id,
        product_name,
        product_image_urls,
        quantity,
        unit_price,
        customization_price,
        total_price,
        customizations,
    ) in order_items_data
    {
        // Decrement stock
        sqlx::query("UPDATE products SET stock_quantity = stock_quantity - $1 WHERE id = $2")
            .bind(quantity)
            .bind(product_id)
            .execute(&mut *tx)
            .await?;

        let order_item_id = Uuid::new_v4();
        sqlx::query(
            r#"
            INSERT INTO order_items (
                id, order_id, product_id, product_name, product_image_urls,
                quantity, unit_price, customization_price, total_price
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            "#,
        )
        .bind(order_item_id)
        .bind(order_id)
        .bind(product_id)
        .bind(&product_name)
        .bind(&product_image_urls)
        .bind(quantity)
        .bind(unit_price)
        .bind(customization_price)
        .bind(total_price)
        .execute(&mut *tx)
        .await?;

        // Create order item customizations
        for cust in customizations {
            let cust_id = Uuid::new_v4();
            let group_id: Uuid = cust.try_get("group_id")?;
            let option_id: Uuid = cust.try_get("option_id")?;
            let group_name: String = cust.try_get("group_name")?;
            let option_name: String = cust.try_get("option_name")?;
            let price_modifier: f64 = cust.try_get("price_modifier")?;

            sqlx::query(
                r#"
                INSERT INTO order_item_customizations (
                    id, order_item_id, group_id, option_id, group_name, option_name, price_modifier
                ) VALUES ($1, $2, $3, $4, $5, $6, $7)
                "#,
            )
            .bind(cust_id)
            .bind(order_item_id)
            .bind(group_id)
            .bind(option_id)
            .bind(&group_name)
            .bind(&option_name)
            .bind(price_modifier)
            .execute(&mut *tx)
            .await?;
        }
    }

    // 8. Record status history
    sqlx::query(
        "INSERT INTO order_status_history (id, order_id, to_status, notes) VALUES ($1, $2, 'pending', 'Order created')"
    )
    .bind(Uuid::new_v4())
    .bind(order_id)
    .execute(&mut *tx)
    .await?;

    // Note: Cart is NOT cleared here. It will be cleared upon successful payment.

    tx.commit().await?;

    // 10. Return order details
    get_order_detail(pool, order_id, user_id).await
}

// ============================================================================
// PAYMENT INITIATION
// ============================================================================

/// Initiate payment for an order (creates Razorpay order)
/// POST /api/orders/:id/pay
pub async fn initiate_payment(
    auth_user: RequiredAuthUser,
    Path(order_id): Path<Uuid>,
    State(state): State<AppState>,
) -> Result<Json<InitiatePaymentResponse>, AppError> {
    tracing::info!(
        "Initiating payment with Razorpay Key ID: '{}'",
        state.razorpay.key_id
    );
    let user_id = auth_user.0.id;
    let pool = &state.db;

    // 1. Get order and verify ownership
    let order = sqlx::query("SELECT * FROM orders WHERE id = $1 AND user_id = $2")
        .bind(order_id)
        .bind(user_id)
        .fetch_optional(pool)
        .await?
        .ok_or(AppError::NotFound("Order not found".into()))?;

    let status: String = order.try_get("status")?;
    if status != "pending" {
        return Err(AppError::BadRequest("Order is not in pending state".into()));
    }

    let total_amount: f64 = order.try_get("total_amount")?;
    let order_number: String = order.try_get("order_number")?;

    // Check if payment already exists for this order
    let existing_payment = sqlx::query(
        "SELECT razorpay_order_id FROM payments WHERE order_id = $1 AND status = 'pending'",
    )
    .bind(order_id)
    .fetch_optional(pool)
    .await?;

    let razorpay_order_id = if let Some(payment) = existing_payment {
        // Return existing Razorpay order ID
        payment.try_get("razorpay_order_id")?
    } else {
        // 2. Create Razorpay order
        let amount_paise = (total_amount * 100.0).round() as i64;
        let razorpay_order_id = create_razorpay_order(
            &state.razorpay.key_id,
            &state.razorpay.key_secret,
            amount_paise,
            "INR",
            &order_number,
        )
        .await?;

        // 3. Create payment record
        sqlx::query(
            r#"
            INSERT INTO payments (id, order_id, razorpay_order_id, amount, currency, status)
            VALUES ($1, $2, $3, $4, 'INR', 'pending')
            "#,
        )
        .bind(Uuid::new_v4())
        .bind(order_id)
        .bind(&razorpay_order_id)
        .bind(total_amount)
        .execute(pool)
        .await?;

        razorpay_order_id
    };

    // 4. Get user details for prefill (fetch phone from DB)
    let user = &auth_user.0;
    let user_row = sqlx::query("SELECT phone FROM users WHERE id = $1")
        .bind(user_id)
        .fetch_one(pool)
        .await?;
    let phone: String = user_row.try_get("phone").unwrap_or_default();

    Ok(Json(InitiatePaymentResponse {
        razorpay_order_id,
        razorpay_key_id: state.razorpay.key_id.clone(),
        amount: (total_amount * 100.0).round() as i64,
        currency: "INR".to_string(),
        order_id,
        order_number,
        prefill: PaymentPrefillDto {
            name: user.name.clone(),
            email: user.email.clone(),
            contact: phone,
        },
    }))
}

/// Create a Razorpay order via their API
async fn create_razorpay_order(
    key_id: &str,
    key_secret: &str,
    amount: i64,
    currency: &str,
    receipt: &str,
) -> Result<String, AppError> {
    let client = reqwest::Client::new();

    let body = serde_json::json!({
        "amount": amount,
        "currency": currency,
        "receipt": receipt,
        "payment_capture": 1  // Auto-capture
    });

    let response = client
        .post("https://api.razorpay.com/v1/orders")
        .basic_auth(key_id, Some(key_secret))
        .json(&body)
        .send()
        .await
        .map_err(|e| AppError::InternalServerError(format!("Razorpay API error: {}", e)))?;

    if !response.status().is_success() {
        let error_text = response.text().await.unwrap_or_default();
        tracing::error!("Razorpay order creation failed: {}", error_text);
        return Err(AppError::InternalServerError(
            "Failed to create payment order".into(),
        ));
    }

    let razorpay_response: serde_json::Value = response.json().await.map_err(|e| {
        AppError::InternalServerError(format!("Failed to parse Razorpay response: {}", e))
    })?;

    razorpay_response["id"]
        .as_str()
        .map(String::from)
        .ok_or(AppError::InternalServerError(
            "Invalid Razorpay response".into(),
        ))
}

// ============================================================================
// PAYMENT VERIFICATION
// ============================================================================

/// Verify payment after Razorpay SDK callback
/// POST /api/payments/verify
pub async fn verify_payment(
    auth_user: RequiredAuthUser,
    State(state): State<AppState>,
    Json(payload): Json<VerifyPaymentRequest>,
) -> Result<Json<PaymentVerificationResponse>, AppError> {
    let user_id = auth_user.0.id;
    let pool = &state.db;

    // Start transaction early and use FOR UPDATE to prevent race conditions
    let mut tx = pool.begin().await?;

    // 1. Find payment by razorpay_order_id with lock to prevent race conditions
    let payment = sqlx::query(
        r#"
        SELECT p.*, o.user_id, o.order_number
        FROM payments p
        JOIN orders o ON p.order_id = o.id
        WHERE p.razorpay_order_id = $1
        FOR UPDATE OF p
        "#,
    )
    .bind(&payload.razorpay_order_id)
    .fetch_optional(&mut *tx)
    .await?
    .ok_or(AppError::NotFound("Payment not found".into()))?;

    // Verify ownership
    let payment_user_id: Uuid = payment.try_get("user_id")?;
    if payment_user_id != user_id {
        return Err(AppError::Forbidden("Not authorized".into()));
    }

    let payment_id: Uuid = payment.try_get("id")?;
    let order_id: Uuid = payment.try_get("order_id")?;
    let order_number: String = payment.try_get("order_number")?;
    let current_status: String = payment.try_get("status")?;

    // Check if already captured (idempotency) - inside transaction with lock
    if current_status == "captured" {
        // Commit to release the lock
        tx.commit().await?;
        return Ok(Json(PaymentVerificationResponse {
            success: true,
            order_id,
            order_number,
            payment_id: payload.razorpay_payment_id.clone(),
            message: "Payment already verified".to_string(),
        }));
    }

    // 2. Verify signature
    let signature_data = format!(
        "{}|{}",
        payload.razorpay_order_id, payload.razorpay_payment_id
    );

    let is_valid = verify_razorpay_signature(
        &signature_data,
        &payload.razorpay_signature,
        &state.razorpay.key_secret,
    );

    if !is_valid {
        tracing::warn!(
            "Payment verification failed: signature mismatch for payment_id: {}",
            payment_id
        );
        return Err(AppError::BadRequest(
            "Payment verification failed: Invalid signature".into(),
        ));
    }

    // 3. Update payment and order (transaction already started)

    // Update payment
    sqlx::query(
        r#"
        UPDATE payments
        SET razorpay_payment_id = $1, razorpay_signature = $2, status = 'captured'
        WHERE id = $3
        "#,
    )
    .bind(&payload.razorpay_payment_id)
    .bind(&payload.razorpay_signature)
    .bind(payment_id)
    .execute(&mut *tx)
    .await?;

    // Update order status
    sqlx::query("UPDATE orders SET status = 'confirmed', confirmed_at = NOW() WHERE id = $1")
        .bind(order_id)
        .execute(&mut *tx)
        .await?;

    // Record status change
    sqlx::query(
        r#"
        INSERT INTO order_status_history (id, order_id, from_status, to_status, notes)
        VALUES ($1, $2, 'pending', 'confirmed', 'Payment verified')
        "#,
    )
    .bind(Uuid::new_v4())
    .bind(order_id)
    .execute(&mut *tx)
    .await?;

    // Clear the cart after successful payment
    sqlx::query("DELETE FROM cart_items WHERE cart_id = (SELECT id FROM carts WHERE user_id = $1)")
        .bind(user_id)
        .execute(&mut *tx)
        .await?;

    tx.commit().await?;

    Ok(Json(PaymentVerificationResponse {
        success: true,
        order_id,
        order_number,
        payment_id: payload.razorpay_payment_id,
        message: "Payment successful".to_string(),
    }))
}

/// Verify Razorpay signature using HMAC-SHA256 with constant-time comparison
fn verify_razorpay_signature(data: &str, signature: &str, secret: &str) -> bool {
    let mut mac =
        HmacSha256::new_from_slice(secret.as_bytes()).expect("HMAC can take key of any size");
    mac.update(data.as_bytes());

    let expected = hex::encode(mac.finalize().into_bytes());
    // Use constant-time comparison to prevent timing attacks
    expected.as_bytes().ct_eq(signature.as_bytes()).into()
}

// ============================================================================
// ORDER LISTING & DETAILS
// ============================================================================

/// Get user's order history
/// GET /api/orders
pub async fn list_orders(
    auth_user: RequiredAuthUser,
    Query(query): Query<OrderListQuery>,
    State(state): State<AppState>,
) -> Result<Json<Vec<OrderSummaryDto>>, AppError> {
    let user_id = auth_user.0.id;
    let pool = &state.db;

    let page = query.page.unwrap_or(1).max(1);
    let limit = query.limit.unwrap_or(20).min(100);
    let offset = (page - 1) * limit;

    // Use parameterized query to prevent SQL injection
    let orders = if let Some(ref status) = query.status {
        // Validate status is a valid enum value to prevent any edge cases
        let valid_statuses = [
            "pending",
            "confirmed",
            "preparing",
            "out_for_delivery",
            "delivered",
            "cancelled",
        ];
        if !valid_statuses.contains(&status.as_str()) {
            return Err(AppError::BadRequest("Invalid order status".into()));
        }

        sqlx::query(
            r#"
            SELECT o.id, o.order_number, o.status, o.total_amount, o.created_at,
                   (SELECT COUNT(*) FROM order_items WHERE order_id = o.id) as item_count
            FROM orders o
            WHERE o.user_id = $1 AND o.status = $4
            ORDER BY o.created_at DESC LIMIT $2 OFFSET $3
            "#,
        )
        .bind(user_id)
        .bind(limit)
        .bind(offset)
        .bind(status)
        .fetch_all(pool)
        .await?
    } else {
        sqlx::query(
            r#"
            SELECT o.id, o.order_number, o.status, o.total_amount, o.created_at,
                   (SELECT COUNT(*) FROM order_items WHERE order_id = o.id) as item_count
            FROM orders o
            WHERE o.user_id = $1
            ORDER BY o.created_at DESC LIMIT $2 OFFSET $3
            "#,
        )
        .bind(user_id)
        .bind(limit)
        .bind(offset)
        .fetch_all(pool)
        .await?
    };

    let result: Vec<OrderSummaryDto> = orders
        .iter()
        .map(|row| OrderSummaryDto {
            id: row.try_get("id").unwrap(),
            order_number: row.try_get("order_number").unwrap(),
            status: row.try_get("status").unwrap(),
            total_amount: row.try_get("total_amount").unwrap(),
            item_count: row.try_get::<i64, _>("item_count").unwrap_or(0) as i32,
            created_at: row.try_get("created_at").ok(),
        })
        .collect();

    Ok(Json(result))
}

/// Get single order details
/// GET /api/orders/:id
pub async fn get_order(
    auth_user: RequiredAuthUser,
    Path(order_id): Path<Uuid>,
    State(state): State<AppState>,
) -> Result<Json<OrderDetailDto>, AppError> {
    let user_id = auth_user.0.id;
    get_order_detail(&state.db, order_id, user_id).await
}

async fn get_order_detail(
    pool: &PgPool,
    order_id: Uuid,
    user_id: Uuid,
) -> Result<Json<OrderDetailDto>, AppError> {
    // 1. Get order
    let order = sqlx::query("SELECT * FROM orders WHERE id = $1 AND user_id = $2")
        .bind(order_id)
        .bind(user_id)
        .fetch_optional(pool)
        .await?
        .ok_or(AppError::NotFound("Order not found".into()))?;

    let address_id: Uuid = order.try_get("address_id")?;
    let status: String = order.try_get("status")?;

    // 2. Get address
    let address = sqlx::query("SELECT * FROM addresses WHERE id = $1")
        .bind(address_id)
        .fetch_one(pool)
        .await?;

    // 3. Get order items
    let items = sqlx::query("SELECT * FROM order_items WHERE order_id = $1")
        .bind(order_id)
        .fetch_all(pool)
        .await?;

    let mut item_dtos = Vec::new();
    for item in items {
        let item_id: Uuid = item.try_get("id")?;

        // Get customizations
        let customizations =
            sqlx::query("SELECT * FROM order_item_customizations WHERE order_item_id = $1")
                .bind(item_id)
                .fetch_all(pool)
                .await?;

        let cust_dtos: Vec<OrderItemCustomizationDto> = customizations
            .iter()
            .map(|c| OrderItemCustomizationDto {
                group_name: c.try_get("group_name").unwrap_or_default(),
                option_name: c.try_get("option_name").unwrap_or_default(),
                price_modifier: c.try_get("price_modifier").unwrap_or(0.0),
            })
            .collect();

        item_dtos.push(OrderItemDto {
            id: item_id,
            product_id: item.try_get("product_id").ok(),
            product_name: item.try_get("product_name").unwrap_or_default(),
            product_image_urls: item.try_get("product_image_urls").unwrap_or_default(),
            quantity: item.try_get("quantity").unwrap_or(0),
            unit_price: item.try_get("unit_price").unwrap_or(0.0),
            customization_price: item.try_get("customization_price").unwrap_or(0.0),
            total_price: item.try_get("total_price").unwrap_or(0.0),
            customizations: cust_dtos,
        });
    }

    // 4. Get payment
    let payment = sqlx::query("SELECT * FROM payments WHERE order_id = $1")
        .bind(order_id)
        .fetch_optional(pool)
        .await?;

    let payment_dto = payment.map(|p| PaymentDto {
        id: p.try_get("id").unwrap(),
        razorpay_order_id: p.try_get("razorpay_order_id").unwrap_or_default(),
        razorpay_payment_id: p.try_get("razorpay_payment_id").ok(),
        amount: p.try_get("amount").unwrap_or(0.0),
        currency: p.try_get("currency").unwrap_or_else(|_| "INR".to_string()),
        status: p.try_get("status").unwrap_or_default(),
        method: p.try_get("method").ok(),
        error_code: p.try_get("error_code").ok(),
        error_description: p.try_get("error_description").ok(),
        created_at: p.try_get("created_at").ok(),
    });

    // 5. Build timeline
    let timeline = build_order_timeline(&status, &order);

    Ok(Json(OrderDetailDto {
        id: order_id,
        order_number: order.try_get("order_number").unwrap_or_default(),
        status,
        subtotal: order.try_get("subtotal").unwrap_or(0.0),
        tax_cgst: order.try_get("tax_cgst").unwrap_or(0.0),
        tax_sgst: order.try_get("tax_sgst").unwrap_or(0.0),
        delivery_charge: order.try_get("delivery_charge").unwrap_or(0.0),
        discount: order.try_get("discount").unwrap_or(0.0),
        total_amount: order.try_get("total_amount").unwrap_or(0.0),
        notes: order.try_get("notes").ok(),
        items: item_dtos,
        address: AddressSnapshotDto {
            recipient_name: address.try_get("recipient_name").unwrap_or_default(),
            phone_number: address.try_get("phone_number").unwrap_or_default(),
            street_address: address.try_get("street_address").unwrap_or_default(),
            city: address.try_get("city").unwrap_or_default(),
            state: address.try_get("state").unwrap_or_default(),
            postal_code: address.try_get("postal_code").unwrap_or_default(),
            label: address.try_get("label").unwrap_or_default(),
        },
        payment: payment_dto,
        timeline,
        delivery_partner_name: order.try_get("delivery_partner_name").ok(),
        delivery_partner_phone: order.try_get("delivery_partner_phone").ok(),
        created_at: order.try_get("created_at").ok(),
    }))
}

fn build_order_timeline(
    current_status: &str,
    order: &sqlx::postgres::PgRow,
) -> Vec<OrderTimelineEventDto> {
    let statuses = [
        "pending",
        "confirmed",
        "preparing",
        "out_for_delivery",
        "delivered",
    ];
    let status_index = statuses.iter().position(|s| *s == current_status);

    statuses
        .iter()
        .enumerate()
        .map(|(i, s)| {
            let timestamp = match *s {
                "pending" => order.try_get("created_at").ok(),
                "confirmed" => order.try_get("confirmed_at").ok(),
                "preparing" => order.try_get("preparing_at").ok(),
                "out_for_delivery" => order.try_get("out_for_delivery_at").ok(),
                "delivered" => order.try_get("delivered_at").ok(),
                _ => None,
            };

            let is_completed = status_index.map(|si| i < si).unwrap_or(false);
            let is_current = status_index.map(|si| i == si).unwrap_or(false);

            OrderTimelineEventDto {
                status: s.to_string(),
                timestamp,
                is_completed: is_completed || is_current,
                is_current,
            }
        })
        .collect()
}

// ============================================================================
// ORDER CANCELLATION
// ============================================================================

/// Cancel an order
/// POST /api/orders/:id/cancel
pub async fn cancel_order(
    auth_user: RequiredAuthUser,
    Path(order_id): Path<Uuid>,
    State(state): State<AppState>,
    Json(payload): Json<CancelOrderRequest>,
) -> Result<Json<OrderDetailDto>, AppError> {
    payload
        .validate()
        .map_err(|e| AppError::BadRequest(e.to_string()))?;

    let user_id = auth_user.0.id;
    let pool = &state.db;

    // Get order
    let order = sqlx::query("SELECT * FROM orders WHERE id = $1 AND user_id = $2")
        .bind(order_id)
        .bind(user_id)
        .fetch_optional(pool)
        .await?
        .ok_or(AppError::NotFound("Order not found".into()))?;

    let current_status: String = order.try_get("status")?;

    // Check if cancellation is allowed
    let current = OrderStatus::from_str(&current_status)
        .map_err(|_| AppError::BadRequest("Invalid order status".into()))?;

    if !current.can_transition_to(OrderStatus::Cancelled) {
        return Err(AppError::BadRequest(format!(
            "Cannot cancel order in '{}' status",
            current_status
        )));
    }

    // Update order
    let mut tx = pool.begin().await?;

    sqlx::query(
        r#"
        UPDATE orders
        SET status = 'cancelled', cancelled_at = NOW(), cancellation_reason = $1
        WHERE id = $2
        "#,
    )
    .bind(&payload.reason)
    .bind(order_id)
    .execute(&mut *tx)
    .await?;

    // Restore stock
    // 1. Get order items
    let items = sqlx::query("SELECT product_id, quantity FROM order_items WHERE order_id = $1")
        .bind(order_id)
        .fetch_all(&mut *tx)
        .await?;

    // 2. Increment stock
    for item in items {
        let product_id: Option<Uuid> = item.try_get("product_id")?;
        let quantity: i32 = item.try_get("quantity")?;

        if let Some(pid) = product_id {
            sqlx::query("UPDATE products SET stock_quantity = stock_quantity + $1 WHERE id = $2")
                .bind(quantity)
                .bind(pid)
                .execute(&mut *tx)
                .await?;
        }
    }

    // Record status change
    sqlx::query(
        r#"
        INSERT INTO order_status_history (id, order_id, from_status, to_status, changed_by, notes)
        VALUES ($1, $2, $3, 'cancelled', $4, $5)
        "#,
    )
    .bind(Uuid::new_v4())
    .bind(order_id)
    .bind(&current_status)
    .bind(user_id)
    .bind(&payload.reason)
    .execute(&mut *tx)
    .await?;

    // If payment was captured, initiate refund
    let payment = sqlx::query("SELECT * FROM payments WHERE order_id = $1 AND status = 'captured'")
        .bind(order_id)
        .fetch_optional(&mut *tx)
        .await?;

    if let Some(p) = payment {
        let payment_id: Uuid = p.try_get("id")?;
        let razorpay_payment_id: String = p.try_get("razorpay_payment_id")?;
        let amount: f64 = p.try_get("amount")?;

        // Initiate refund via Razorpay
        let refund_result = initiate_razorpay_refund(
            &state.razorpay.key_id,
            &state.razorpay.key_secret,
            &razorpay_payment_id,
            (amount * 100.0).round() as i64,
        )
        .await;

        match refund_result {
            Ok(refund_id) => {
                sqlx::query(
                    r#"
                    UPDATE payments
                    SET status = 'refunded', refund_id = $1, refund_status = 'pending',
                        refund_amount = $2, refunded_at = NOW()
                    WHERE id = $3
                    "#,
                )
                .bind(&refund_id)
                .bind(amount)
                .bind(payment_id)
                .execute(&mut *tx)
                .await?;
            }
            Err(e) => {
                tracing::error!("Failed to initiate refund: {:?}", e);
                // Continue with cancellation, refund can be retried
            }
        }
    }

    tx.commit().await?;

    get_order_detail(pool, order_id, user_id).await
}

async fn initiate_razorpay_refund(
    key_id: &str,
    key_secret: &str,
    payment_id: &str,
    amount: i64,
) -> Result<String, AppError> {
    let client = reqwest::Client::new();

    let body = serde_json::json!({
        "amount": amount,
        "speed": "normal"
    });

    let url = format!("https://api.razorpay.com/v1/payments/{}/refund", payment_id);

    let response = client
        .post(&url)
        .basic_auth(key_id, Some(key_secret))
        .json(&body)
        .send()
        .await
        .map_err(|e| AppError::InternalServerError(format!("Razorpay API error: {}", e)))?;

    if !response.status().is_success() {
        let error_text = response.text().await.unwrap_or_default();
        tracing::error!("Razorpay refund failed: {}", error_text);
        return Err(AppError::InternalServerError(
            "Failed to initiate refund".into(),
        ));
    }

    let refund_response: serde_json::Value = response.json().await.map_err(|e| {
        AppError::InternalServerError(format!("Failed to parse refund response: {}", e))
    })?;

    refund_response["id"]
        .as_str()
        .map(String::from)
        .ok_or(AppError::InternalServerError(
            "Invalid refund response".into(),
        ))
}

// ============================================================================
// PAYMENT HISTORY
// ============================================================================

/// Get user's payment history
/// GET /api/payments
pub async fn list_payments(
    auth_user: RequiredAuthUser,
    Query(query): Query<PaymentHistoryQuery>,
    State(state): State<AppState>,
) -> Result<Json<PaymentHistoryListDto>, AppError> {
    let user_id = auth_user.0.id;
    let pool = &state.db;

    let page = query.page.unwrap_or(1).max(1);
    let limit = query.limit.unwrap_or(20).min(100);
    let offset = (page - 1) * limit;

    // Use parameterized query to prevent SQL injection
    let payments = if let Some(ref status) = query.status {
        // Validate status is a valid enum value
        let valid_statuses = ["pending", "authorized", "captured", "failed", "refunded"];
        if !valid_statuses.contains(&status.as_str()) {
            return Err(AppError::BadRequest("Invalid payment status".into()));
        }

        sqlx::query(
            r#"
            SELECT p.*, o.order_number
            FROM payments p
            JOIN orders o ON p.order_id = o.id
            WHERE o.user_id = $1 AND p.status = $4
            ORDER BY p.created_at DESC LIMIT $2 OFFSET $3
            "#,
        )
        .bind(user_id)
        .bind(limit)
        .bind(offset)
        .bind(status)
        .fetch_all(pool)
        .await?
    } else {
        sqlx::query(
            r#"
            SELECT p.*, o.order_number
            FROM payments p
            JOIN orders o ON p.order_id = o.id
            WHERE o.user_id = $1
            ORDER BY p.created_at DESC LIMIT $2 OFFSET $3
            "#,
        )
        .bind(user_id)
        .bind(limit)
        .bind(offset)
        .fetch_all(pool)
        .await?
    };

    let payment_dtos: Vec<PaymentHistoryDto> = payments
        .iter()
        .map(|p| PaymentHistoryDto {
            id: p.try_get("id").unwrap(),
            order_id: p.try_get("order_id").unwrap(),
            order_number: p.try_get("order_number").unwrap_or_default(),
            razorpay_order_id: p.try_get("razorpay_order_id").unwrap_or_default(),
            razorpay_payment_id: p.try_get("razorpay_payment_id").ok(),
            amount: p.try_get("amount").unwrap_or(0.0),
            currency: p.try_get("currency").unwrap_or_else(|_| "INR".to_string()),
            status: p.try_get("status").unwrap_or_default(),
            method: p.try_get("method").ok(),
            error_code: p.try_get("error_code").ok(),
            error_description: p.try_get("error_description").ok(),
            created_at: p.try_get("created_at").ok(),
        })
        .collect();

    // Get summary stats
    let stats = sqlx::query(
        r#"
        SELECT
            COUNT(*) as total_count,
            COALESCE(SUM(CASE WHEN p.status = 'captured' THEN p.amount ELSE 0 END), 0) as total_successful,
            COUNT(CASE WHEN p.status = 'failed' THEN 1 END) as total_failed_count,
            COALESCE(SUM(CASE WHEN p.status = 'refunded' THEN p.refund_amount ELSE 0 END), 0) as total_refunded
        FROM payments p
        JOIN orders o ON p.order_id = o.id
        WHERE o.user_id = $1
        "#,
    )
    .bind(user_id)
    .fetch_one(pool)
    .await?;

    Ok(Json(PaymentHistoryListDto {
        payments: payment_dtos,
        total_count: stats.try_get("total_count").unwrap_or(0),
        total_successful: stats.try_get("total_successful").unwrap_or(0.0),
        total_failed_count: stats.try_get("total_failed_count").unwrap_or(0),
        total_refunded: stats.try_get("total_refunded").unwrap_or(0.0),
    }))
}

/// Get single payment details
/// GET /api/payments/:id
pub async fn get_payment(
    auth_user: RequiredAuthUser,
    Path(payment_id): Path<Uuid>,
    State(state): State<AppState>,
) -> Result<Json<PaymentHistoryDto>, AppError> {
    let user_id = auth_user.0.id;
    let pool = &state.db;

    let payment = sqlx::query(
        r#"
        SELECT p.*, o.order_number
        FROM payments p
        JOIN orders o ON p.order_id = o.id
        WHERE p.id = $1 AND o.user_id = $2
        "#,
    )
    .bind(payment_id)
    .bind(user_id)
    .fetch_optional(pool)
    .await?
    .ok_or(AppError::NotFound("Payment not found".into()))?;

    Ok(Json(PaymentHistoryDto {
        id: payment.try_get("id")?,
        order_id: payment.try_get("order_id")?,
        order_number: payment.try_get("order_number").unwrap_or_default(),
        razorpay_order_id: payment.try_get("razorpay_order_id").unwrap_or_default(),
        razorpay_payment_id: payment.try_get("razorpay_payment_id").ok(),
        amount: payment.try_get("amount").unwrap_or(0.0),
        currency: payment
            .try_get("currency")
            .unwrap_or_else(|_| "INR".to_string()),
        status: payment.try_get("status").unwrap_or_default(),
        method: payment.try_get("method").ok(),
        error_code: payment.try_get("error_code").ok(),
        error_description: payment.try_get("error_description").ok(),
        created_at: payment.try_get("created_at").ok(),
    }))
}
#[cfg(test)]
mod webhook_unit_tests {
    use super::*;

    #[test]
    fn test_verify_webhook_signature() {
        let body = r#"{"event":"payment.captured","payload":{}}"#;
        let secret = "test_secret";

        // Generate expected signature
        let mut mac = HmacSha256::new_from_slice(secret.as_bytes()).unwrap();
        mac.update(body.as_bytes());
        let signature = hex::encode(mac.finalize().into_bytes());

        assert!(verify_webhook_signature(body, &signature, secret));
        assert!(!verify_webhook_signature(body, "wrong_signature", secret));
        assert!(!verify_webhook_signature("wrong_body", &signature, secret));
    }
}
