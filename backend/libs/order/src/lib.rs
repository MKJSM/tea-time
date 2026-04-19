use backend_address::{get_default_for_user, Address};
use backend_shared::{map_pool_error_to_app_error, AppError};
use deadpool_postgres::Pool;
use serde::{Deserialize, Serialize};
use tokio_postgres::Row;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize)]
pub struct CartItem {
    pub id: String,
    pub product_id: String,
    pub product_name: String,
    pub images: Vec<String>,
    pub quantity: i32,
    pub unit_price: f64,
    pub line_total: f64,
}

#[derive(Debug, Clone, Serialize)]
pub struct CartResponse {
    pub cart_id: String,
    pub items: Vec<CartItem>,
    pub total_amount: f64,
}

#[derive(Debug, Clone, Deserialize)]
pub struct CartItemInput {
    pub product_id: String,
    pub quantity: i32,
}

#[derive(Debug, Clone, Deserialize)]
pub struct CheckoutInput {
    pub address_id: Option<String>,
}

#[derive(Debug, Clone, Serialize)]
pub struct OrderSummary {
    pub id: String,
    pub order_number: String,
    pub status: String,
    pub payment_status: String,
    pub total_amount: f64,
    pub currency: String,
    pub placed_on: String,
}

#[derive(Debug, Clone, Serialize)]
pub struct OrderDetail {
    pub id: String,
    pub order_number: String,
    pub status: String,
    pub payment_status: String,
    pub total_amount: f64,
    pub currency: String,
    pub address: Address,
    pub items: Vec<CartItem>,
}

#[derive(Debug, Clone, Serialize)]
pub struct CheckoutResult {
    pub order_id: String,
    pub order_number: String,
    pub total_amount: f64,
    pub currency: String,
}

pub async fn get_cart(pool: &Pool, user_id: &str) -> Result<CartResponse, AppError> {
    let cart_id = ensure_cart(pool, user_id).await?;
    load_cart(pool, &cart_id).await
}

pub async fn add_cart_item(pool: &Pool, user_id: &str, input: CartItemInput) -> Result<CartResponse, AppError> {
    validate_qty(input.quantity)?;
    let cart_id = ensure_cart(pool, user_id).await?;
    let client = pool.get().await.map_err(map_pool_error_to_app_error)?;
    let product = client.query_opt(
        "SELECT id::text, name, price FROM product WHERE id = $1::text::uuid",
        &[&input.product_id]
    ).await?;
    let product = product.ok_or_else(|| AppError::NotFound("product not found".into()))?;
    let price: f64 = product.get(2);
    client.execute(
        "INSERT INTO cart_item (id, cart_id, product_id, quantity, unit_price_snapshot)
         VALUES ($1::text::uuid, $2::text::uuid, $3::text::uuid, $4, $5)
         ON CONFLICT (cart_id, product_id)
         DO UPDATE SET quantity = cart_item.quantity + EXCLUDED.quantity, unit_price_snapshot = EXCLUDED.unit_price_snapshot, modified_on = NOW()",
        &[&Uuid::new_v4().to_string(), &cart_id, &input.product_id, &input.quantity, &price]
    ).await?;
    load_cart(pool, &cart_id).await
}

pub async fn update_cart_item(pool: &Pool, user_id: &str, cart_item_id: &str, quantity: i32) -> Result<CartResponse, AppError> {
    validate_qty(quantity)?;
    let cart_id = ensure_cart(pool, user_id).await?;
    let client = pool.get().await.map_err(map_pool_error_to_app_error)?;
    let updated = client.execute(
        "UPDATE cart_item SET quantity = $3, modified_on = NOW()
         WHERE id = $1::text::uuid AND cart_id = $2::text::uuid",
        &[&cart_item_id, &cart_id, &quantity]
    ).await?;
    if updated == 0 {
        return Err(AppError::NotFound("cart item not found".into()));
    }
    load_cart(pool, &cart_id).await
}

pub async fn delete_cart_item(pool: &Pool, user_id: &str, cart_item_id: &str) -> Result<CartResponse, AppError> {
    let cart_id = ensure_cart(pool, user_id).await?;
    let client = pool.get().await.map_err(map_pool_error_to_app_error)?;
    let deleted = client.execute(
        "DELETE FROM cart_item WHERE id = $1::text::uuid AND cart_id = $2::text::uuid",
        &[&cart_item_id, &cart_id]
    ).await?;
    if deleted == 0 {
        return Err(AppError::NotFound("cart item not found".into()));
    }
    load_cart(pool, &cart_id).await
}

pub async fn checkout(pool: &Pool, user_id: &str, input: CheckoutInput) -> Result<CheckoutResult, AppError> {
    let cart_id = ensure_cart(pool, user_id).await?;
    let cart = load_cart(pool, &cart_id).await?;
    if cart.items.is_empty() {
        return Err(AppError::BadRequest("cart is empty".into()));
    }
    let address = match input.address_id {
        Some(address_id) => backend_address::get_for_user(pool, user_id, &address_id).await?,
        None => get_default_for_user(pool, user_id).await?,
    };
    let order_id = Uuid::new_v4().to_string();
    let order_number = format!("TT-{}", &order_id[..8].to_uppercase());
    let mut client = pool.get().await.map_err(map_pool_error_to_app_error)?;
    let tx = client.transaction().await?;
    tx.execute(
        "INSERT INTO customer_order
         (id, user_id, address_id, order_number, status, payment_status, subtotal_amount, total_amount, currency,
          recipient_name, recipient_phone, line_1, line_2, city, state, postal_code, country, landmark)
         VALUES
         ($1::text::uuid, $2::text::uuid, $3::text::uuid, $4, 'placed', 'pending', $5, $5, 'INR',
          $6, $7, $8, $9, $10, $11, $12, $13, $14)",
        &[&order_id, &user_id, &address.id, &order_number, &cart.total_amount, &address.full_name,
          &address.phone, &address.line_1, &address.line_2, &address.city, &address.state, &address.postal_code,
          &address.country, &address.landmark]
    ).await?;
    for item in &cart.items {
        tx.execute(
            "INSERT INTO order_item (id, order_id, product_id, product_name_snapshot, unit_price, quantity, line_total)
             VALUES ($1::text::uuid, $2::text::uuid, $3::text::uuid, $4, $5, $6, $7)",
            &[&Uuid::new_v4().to_string(), &order_id, &item.product_id, &item.product_name, &item.unit_price, &item.quantity, &item.line_total]
        ).await?;
    }
    tx.execute(
        "INSERT INTO payment (id, order_id, user_id, provider, status, amount, currency)
         VALUES ($1::text::uuid, $2::text::uuid, $3::text::uuid, 'razorpay', 'pending', $4, 'INR')",
        &[&Uuid::new_v4().to_string(), &order_id, &user_id, &cart.total_amount]
    ).await?;
    tx.commit().await?;
    Ok(CheckoutResult { order_id, order_number, total_amount: cart.total_amount, currency: "INR".into() })
}

pub async fn list_orders_for_user(pool: &Pool, user_id: &str) -> Result<serde_json::Value, AppError> {
    let client = pool.get().await.map_err(map_pool_error_to_app_error)?;
    let rows = client.query(
        "SELECT id::text, order_number, status, payment_status, total_amount, currency, placed_on::text
         FROM customer_order WHERE user_id = $1::text::uuid ORDER BY placed_on DESC",
        &[&user_id]
    ).await?;
    Ok(serde_json::json!({"ok": true, "items": rows.iter().map(map_order_summary).collect::<Vec<_>>()}))
}

pub async fn list_orders_admin(pool: &Pool) -> Result<serde_json::Value, AppError> {
    let client = pool.get().await.map_err(map_pool_error_to_app_error)?;
    let rows = client.query(
        "SELECT id::text, order_number, status, payment_status, total_amount, currency, placed_on::text
         FROM customer_order ORDER BY placed_on DESC",
        &[]
    ).await?;
    Ok(serde_json::json!({"ok": true, "items": rows.iter().map(map_order_summary).collect::<Vec<_>>()}))
}

pub async fn get_order_for_user(pool: &Pool, user_id: &str, order_id: &str) -> Result<OrderDetail, AppError> {
    get_order(pool, Some(user_id), order_id).await
}

pub async fn get_order_admin(pool: &Pool, order_id: &str) -> Result<OrderDetail, AppError> {
    get_order(pool, None, order_id).await
}

pub async fn update_order_status(pool: &Pool, order_id: &str, status: &str) -> Result<(), AppError> {
    if !matches!(status, "placed" | "paid" | "cancelled" | "completed") {
        return Err(AppError::BadRequest("invalid order status".into()));
    }
    let client = pool.get().await.map_err(map_pool_error_to_app_error)?;
    let updated = client.execute(
        "UPDATE customer_order SET status = $2, modified_on = NOW() WHERE id = $1::text::uuid",
        &[&order_id, &status]
    ).await?;
    if updated == 0 { return Err(AppError::NotFound("order not found".into())); }
    Ok(())
}

pub async fn clear_cart_by_user(pool: &Pool, user_id: &str) -> Result<(), AppError> {
    let cart_id = ensure_cart(pool, user_id).await?;
    let client = pool.get().await.map_err(map_pool_error_to_app_error)?;
    client.execute("DELETE FROM cart_item WHERE cart_id = $1::text::uuid", &[&cart_id]).await?;
    Ok(())
}

async fn get_order(pool: &Pool, user_id: Option<&str>, order_id: &str) -> Result<OrderDetail, AppError> {
    let client = pool.get().await.map_err(map_pool_error_to_app_error)?;
    let row = if let Some(user_id) = user_id {
        client.query_opt(
            "SELECT id::text, order_number, status, payment_status, total_amount, currency, address_id::text
             FROM customer_order WHERE id = $1::text::uuid AND user_id = $2::text::uuid",
            &[&order_id, &user_id]
        ).await?
    } else {
        client.query_opt(
            "SELECT id::text, order_number, status, payment_status, total_amount, currency, address_id::text
             FROM customer_order WHERE id = $1::text::uuid",
            &[&order_id]
        ).await?
    };
    let row = row.ok_or_else(|| AppError::NotFound("order not found".into()))?;
    let address_id: String = row.get(6);
    let address_user_id = user_id.unwrap_or_else(|| "");
    let address = if let Some(user_id) = user_id {
        backend_address::get_for_user(pool, user_id, &address_id).await?
    } else {
        load_address_any(pool, &address_id).await?
    };
    let item_rows = client.query(
        "SELECT oi.id::text, oi.product_id::text, oi.product_name_snapshot, COALESCE(p.images, '{}'::text[]), oi.quantity, oi.unit_price, oi.line_total
         FROM order_item oi
         LEFT JOIN product p ON p.id = oi.product_id
         WHERE oi.order_id = $1::text::uuid",
        &[&order_id]
    ).await?;
    let _ = address_user_id;
    Ok(OrderDetail {
        id: row.get(0),
        order_number: row.get(1),
        status: row.get(2),
        payment_status: row.get(3),
        total_amount: row.get(4),
        currency: row.get(5),
        address,
        items: item_rows.iter().map(map_order_item).collect(),
    })
}

async fn ensure_cart(pool: &Pool, user_id: &str) -> Result<String, AppError> {
    let client = pool.get().await.map_err(map_pool_error_to_app_error)?;
    let existing = client.query_opt("SELECT id::text FROM cart WHERE user_id = $1::text::uuid", &[&user_id]).await?;
    if let Some(row) = existing {
        return Ok(row.get(0));
    }
    let cart_id = Uuid::new_v4().to_string();
    client.execute(
        "INSERT INTO cart (id, user_id) VALUES ($1::text::uuid, $2::text::uuid)",
        &[&cart_id, &user_id]
    ).await?;
    Ok(cart_id)
}

async fn load_cart(pool: &Pool, cart_id: &str) -> Result<CartResponse, AppError> {
    let client = pool.get().await.map_err(map_pool_error_to_app_error)?;
    let rows = client.query(
        "SELECT ci.id::text, ci.product_id::text, p.name, p.images, ci.quantity, ci.unit_price_snapshot, (ci.quantity * ci.unit_price_snapshot) AS line_total
         FROM cart_item ci
         JOIN product p ON p.id = ci.product_id
         WHERE ci.cart_id = $1::text::uuid
         ORDER BY ci.created_on ASC",
        &[&cart_id]
    ).await?;
    let items = rows.iter().map(map_cart_item).collect::<Vec<_>>();
    let total_amount = items.iter().map(|item| item.line_total).sum();
    Ok(CartResponse { cart_id: cart_id.into(), items, total_amount })
}

fn map_cart_item(row: &Row) -> CartItem {
    CartItem {
        id: row.get(0),
        product_id: row.get(1),
        product_name: row.get(2),
        images: row.get(3),
        quantity: row.get(4),
        unit_price: row.get(5),
        line_total: row.get(6),
    }
}

fn map_order_item(row: &Row) -> CartItem {
    CartItem {
        id: row.get(0),
        product_id: row.get(1),
        product_name: row.get(2),
        images: row.get(3),
        quantity: row.get(4),
        unit_price: row.get(5),
        line_total: row.get(6),
    }
}

fn map_order_summary(row: &Row) -> OrderSummary {
    OrderSummary {
        id: row.get(0),
        order_number: row.get(1),
        status: row.get(2),
        payment_status: row.get(3),
        total_amount: row.get(4),
        currency: row.get(5),
        placed_on: row.get(6),
    }
}

async fn load_address_any(pool: &Pool, address_id: &str) -> Result<Address, AppError> {
    let client = pool.get().await.map_err(map_pool_error_to_app_error)?;
    let row = client.query_opt(
        "SELECT id::text, user_id::text, full_name, phone, line_1, line_2, city, state, postal_code, country, landmark, is_default
         FROM address WHERE id = $1::text::uuid",
        &[&address_id]
    ).await?;
    row.map(|row| Address {
        id: row.get(0), user_id: row.get(1), full_name: row.get(2), phone: row.get(3), line_1: row.get(4),
        line_2: row.get(5), city: row.get(6), state: row.get(7), postal_code: row.get(8), country: row.get(9),
        landmark: row.get(10), is_default: row.get(11),
    }).ok_or_else(|| AppError::NotFound("address not found".into()))
}

fn validate_qty(quantity: i32) -> Result<(), AppError> {
    if quantity <= 0 {
        return Err(AppError::BadRequest("quantity must be greater than zero".into()));
    }
    Ok(())
}
