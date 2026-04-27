use std::collections::{BTreeMap, BTreeSet};

use backend_address::{get_default_for_user, Address};
use backend_shared::{map_pool_error_to_app_error, AppError};
use deadpool_postgres::Pool;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use tokio_postgres::Row;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SelectedCustomizationSnapshot {
    pub group_id: String,
    pub group_name: String,
    pub option_id: String,
    pub option_name: String,
    pub price_delta: f64,
}

#[derive(Debug, Clone, Serialize)]
pub struct CartItem {
    pub id: String,
    pub product_id: String,
    pub product_name: String,
    pub images: Vec<String>,
    pub quantity: i32,
    pub unit_price: f64,
    pub line_total: f64,
    pub selected_customizations: Vec<SelectedCustomizationSnapshot>,
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
    #[serde(default)]
    pub selected_customization_option_ids: Vec<String>,
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

#[derive(Debug, Clone)]
struct CustomizationGroupRow {
    group_id: String,
    group_name: String,
    min_select: i32,
    max_select: i32,
    sort_order: i32,
    option_id: Option<String>,
    option_name: Option<String>,
    option_price_delta: Option<f64>,
    option_sort_order: Option<i32>,
}

pub async fn get_cart(pool: &Pool, user_id: &str) -> Result<CartResponse, AppError> {
    let cart_id = ensure_cart(pool, user_id).await?;
    load_cart(pool, &cart_id).await
}

pub async fn add_cart_item(
    pool: &Pool,
    user_id: &str,
    input: CartItemInput,
) -> Result<CartResponse, AppError> {
    validate_qty(input.quantity)?;
    let cart_id = ensure_cart(pool, user_id).await?;
    let client = pool.get().await.map_err(map_pool_error_to_app_error)?;

    let product = client
        .query_opt(
            "SELECT id::text, name, price FROM product WHERE id = $1::text::uuid",
            &[&input.product_id],
        )
        .await?;
    let product = product.ok_or_else(|| AppError::NotFound("product not found".into()))?;
    let price: f64 = product.get(2);

    let customization_groups = load_product_customizations(&client, &input.product_id).await?;
    let selection = resolve_customization_selection(
        &customization_groups,
        &input.selected_customization_option_ids,
    )?;
    let selected_customizations_json = serde_json::to_value(&selection)
        .map_err(|error| AppError::Config(format!("failed to serialize customization snapshot: {error}")))?;
    let selection_price_delta: f64 = selection.iter().map(|item| item.price_delta).sum();
    let unit_price = price + selection_price_delta;

    client
        .execute(
            r#"
            INSERT INTO cart_item
                (id, cart_id, product_id, quantity, unit_price_snapshot, selected_customizations_json)
            VALUES
                ($1::text::uuid, $2::text::uuid, $3::text::uuid, $4, $5, $6)
            ON CONFLICT (cart_id, product_id, selected_customizations_json)
            DO UPDATE SET quantity = cart_item.quantity + EXCLUDED.quantity, modified_on = NOW()
            "#,
            &[
                &Uuid::new_v4().to_string(),
                &cart_id,
                &input.product_id,
                &input.quantity,
                &unit_price,
                &selected_customizations_json,
            ],
        )
        .await?;
    load_cart(pool, &cart_id).await
}

pub async fn update_cart_item(
    pool: &Pool,
    user_id: &str,
    cart_item_id: &str,
    quantity: i32,
) -> Result<CartResponse, AppError> {
    validate_qty(quantity)?;
    let cart_id = ensure_cart(pool, user_id).await?;
    let client = pool.get().await.map_err(map_pool_error_to_app_error)?;
    let updated = client
        .execute(
            "UPDATE cart_item SET quantity = $3, modified_on = NOW()
         WHERE id = $1::text::uuid AND cart_id = $2::text::uuid",
            &[&cart_item_id, &cart_id, &quantity],
        )
        .await?;
    if updated == 0 {
        return Err(AppError::NotFound("cart item not found".into()));
    }
    load_cart(pool, &cart_id).await
}

pub async fn delete_cart_item(
    pool: &Pool,
    user_id: &str,
    cart_item_id: &str,
) -> Result<CartResponse, AppError> {
    let cart_id = ensure_cart(pool, user_id).await?;
    let client = pool.get().await.map_err(map_pool_error_to_app_error)?;
    let deleted = client
        .execute(
            "DELETE FROM cart_item WHERE id = $1::text::uuid AND cart_id = $2::text::uuid",
            &[&cart_item_id, &cart_id],
        )
        .await?;
    if deleted == 0 {
        return Err(AppError::NotFound("cart item not found".into()));
    }
    load_cart(pool, &cart_id).await
}

pub async fn checkout(
    pool: &Pool,
    user_id: &str,
    input: CheckoutInput,
) -> Result<CheckoutResult, AppError> {
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
        let selected_customizations_json = serde_json::to_value(&item.selected_customizations)
            .map_err(|error| AppError::Config(format!("failed to serialize customization snapshot: {error}")))?;
        tx.execute(
            "INSERT INTO order_item (id, order_id, product_id, product_name_snapshot, unit_price, quantity, line_total, selected_customizations_json)
             VALUES ($1::text::uuid, $2::text::uuid, $3::text::uuid, $4, $5, $6, $7, $8)",
            &[&Uuid::new_v4().to_string(), &order_id, &item.product_id, &item.product_name, &item.unit_price, &item.quantity, &item.line_total, &selected_customizations_json]
        ).await?;
    }
    tx.execute(
        "INSERT INTO payment (id, order_id, user_id, provider, status, amount, currency)
         VALUES ($1::text::uuid, $2::text::uuid, $3::text::uuid, 'razorpay', 'pending', $4, 'INR')",
        &[
            &Uuid::new_v4().to_string(),
            &order_id,
            &user_id,
            &cart.total_amount,
        ],
    )
    .await?;
    tx.commit().await?;
    Ok(CheckoutResult {
        order_id,
        order_number,
        total_amount: cart.total_amount,
        currency: "INR".into(),
    })
}

pub async fn list_orders_for_user(
    pool: &Pool,
    user_id: &str,
) -> Result<serde_json::Value, AppError> {
    let client = pool.get().await.map_err(map_pool_error_to_app_error)?;
    let rows = client.query(
        "SELECT id::text, order_number, status, payment_status, total_amount, currency, placed_on::text
         FROM customer_order WHERE user_id = $1::text::uuid ORDER BY placed_on DESC",
        &[&user_id]
    ).await?;
    Ok(
        serde_json::json!({"ok": true, "items": rows.iter().map(map_order_summary).collect::<Vec<_>>()}),
    )
}

pub async fn list_orders_admin(pool: &Pool) -> Result<serde_json::Value, AppError> {
    let client = pool.get().await.map_err(map_pool_error_to_app_error)?;
    let rows = client.query(
        "SELECT id::text, order_number, status, payment_status, total_amount, currency, placed_on::text
         FROM customer_order ORDER BY placed_on DESC",
        &[]
    ).await?;
    Ok(
        serde_json::json!({"ok": true, "items": rows.iter().map(map_order_summary).collect::<Vec<_>>()}),
    )
}

pub async fn get_order_for_user(
    pool: &Pool,
    user_id: &str,
    order_id: &str,
) -> Result<OrderDetail, AppError> {
    get_order(pool, Some(user_id), order_id).await
}

pub async fn get_order_admin(pool: &Pool, order_id: &str) -> Result<OrderDetail, AppError> {
    get_order(pool, None, order_id).await
}

pub async fn update_order_status(
    pool: &Pool,
    order_id: &str,
    status: &str,
) -> Result<(), AppError> {
    if !matches!(status, "placed" | "paid" | "cancelled" | "completed") {
        return Err(AppError::BadRequest("invalid order status".into()));
    }
    let client = pool.get().await.map_err(map_pool_error_to_app_error)?;
    let updated = client
        .execute(
            "UPDATE customer_order SET status = $2, modified_on = NOW() WHERE id = $1::text::uuid",
            &[&order_id, &status],
        )
        .await?;
    if updated == 0 {
        return Err(AppError::NotFound("order not found".into()));
    }
    Ok(())
}

pub async fn clear_cart_by_user(pool: &Pool, user_id: &str) -> Result<(), AppError> {
    let cart_id = ensure_cart(pool, user_id).await?;
    let client = pool.get().await.map_err(map_pool_error_to_app_error)?;
    client
        .execute(
            "DELETE FROM cart_item WHERE cart_id = $1::text::uuid",
            &[&cart_id],
        )
        .await?;
    Ok(())
}

async fn get_order(
    pool: &Pool,
    user_id: Option<&str>,
    order_id: &str,
) -> Result<OrderDetail, AppError> {
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
    let address = if let Some(user_id) = user_id {
        backend_address::get_for_user(pool, user_id, &address_id).await?
    } else {
        load_address_any(pool, &address_id).await?
    };
    let item_rows = client.query(
        "SELECT oi.id::text, oi.product_id::text, oi.product_name_snapshot, COALESCE(p.images, '{}'::text[]), oi.quantity, oi.unit_price, oi.line_total, oi.selected_customizations_json
         FROM order_item oi
         LEFT JOIN product p ON p.id = oi.product_id
         WHERE oi.order_id = $1::text::uuid",
        &[&order_id]
    ).await?;
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
    let existing = client
        .query_opt(
            "SELECT id::text FROM cart WHERE user_id = $1::text::uuid",
            &[&user_id],
        )
        .await?;
    if let Some(row) = existing {
        return Ok(row.get(0));
    }
    let cart_id = Uuid::new_v4().to_string();
    client
        .execute(
            "INSERT INTO cart (id, user_id) VALUES ($1::text::uuid, $2::text::uuid)",
            &[&cart_id, &user_id],
        )
        .await?;
    Ok(cart_id)
}

async fn load_cart(pool: &Pool, cart_id: &str) -> Result<CartResponse, AppError> {
    let client = pool.get().await.map_err(map_pool_error_to_app_error)?;
    let rows = client.query(
        "SELECT ci.id::text, ci.product_id::text, p.name, p.images, ci.quantity, ci.unit_price_snapshot, (ci.quantity * ci.unit_price_snapshot) AS line_total, ci.selected_customizations_json
         FROM cart_item ci
         JOIN product p ON p.id = ci.product_id
         WHERE ci.cart_id = $1::text::uuid
         ORDER BY ci.created_on ASC",
        &[&cart_id]
    ).await?;
    let items = rows.iter().map(map_cart_item).collect::<Vec<_>>();
    let total_amount = items.iter().map(|item| item.line_total).sum();
    Ok(CartResponse {
        cart_id: cart_id.into(),
        items,
        total_amount,
    })
}

async fn load_product_customizations(
    client: &deadpool_postgres::Client,
    product_id: &str,
) -> Result<Vec<CustomizationGroupRow>, AppError> {
    let rows = client
        .query(
            r#"
            SELECT
                g.id::text AS group_id,
                g.name AS group_name,
                g.min_select,
                g.max_select,
                g.sort_order,
                o.id::text AS option_id,
                o.name AS option_name,
                o.price_delta AS option_price_delta,
                o.sort_order AS option_sort_order
            FROM product_customization_group g
            LEFT JOIN product_customization_option o ON o.group_id = g.id
            WHERE g.product_id = $1::text::uuid
            ORDER BY g.sort_order ASC, o.sort_order ASC, o.created_on ASC
            "#,
            &[&product_id],
        )
        .await?;

    let mut result = Vec::with_capacity(rows.len());
    for row in rows {
        result.push(CustomizationGroupRow {
            group_id: row.get(0),
            group_name: row.get(1),
            min_select: row.get(2),
            max_select: row.get(3),
            sort_order: row.get(4),
            option_id: row.get(5),
            option_name: row.get(6),
            option_price_delta: row.get(7),
            option_sort_order: row.get(8),
        });
    }
    Ok(result)
}

fn resolve_customization_selection(
    rows: &[CustomizationGroupRow],
    selected_option_ids: &[String],
) -> Result<Vec<SelectedCustomizationSnapshot>, AppError> {
    let mut groups: BTreeMap<String, GroupAccumulator> = BTreeMap::new();
    for row in rows {
        let entry = groups.entry(row.group_id.clone()).or_insert_with(|| GroupAccumulator {
            group_id: row.group_id.clone(),
            group_name: row.group_name.clone(),
            min_select: row.min_select,
            max_select: row.max_select,
            sort_order: row.sort_order,
            options: Vec::new(),
        });
        if let Some(option_id) = &row.option_id {
            entry.options.push(OptionAccumulator {
                option_id: option_id.clone(),
                option_name: row.option_name.clone().unwrap_or_default(),
                price_delta: row.option_price_delta.unwrap_or(0.0),
                sort_order: row.option_sort_order.unwrap_or(0),
            });
        }
    }

    let mut selected_ids = BTreeSet::new();
    for option_id in selected_option_ids {
        if !selected_ids.insert(option_id.clone()) {
            return Err(AppError::BadRequest(
                "duplicate customization options are not allowed".into(),
            ));
        }
    }

    let mut selection = Vec::new();
    let mut matched_option_ids = BTreeSet::new();

    let mut ordered_groups: Vec<GroupAccumulator> = groups.into_values().collect();
    ordered_groups.sort_by_key(|group| group.sort_order);

    for group in ordered_groups {
        let mut chosen = Vec::new();
        for option in &group.options {
            if selected_ids.contains(&option.option_id) {
                chosen.push(option.clone());
                matched_option_ids.insert(option.option_id.clone());
            }
        }

        if chosen.len() < group.min_select as usize || chosen.len() > group.max_select as usize {
            return Err(AppError::BadRequest(format!(
                "customization group '{}' requires between {} and {} selection(s)",
                group.group_name, group.min_select, group.max_select
            )));
        }

        chosen.sort_by_key(|option| option.sort_order);
        for option in chosen {
            selection.push(SelectedCustomizationSnapshot {
                group_id: group.group_id.clone(),
                group_name: group.group_name.clone(),
                option_id: option.option_id,
                option_name: option.option_name,
                price_delta: option.price_delta,
            });
        }
    }

    if matched_option_ids.len() != selected_ids.len() {
        return Err(AppError::BadRequest(
            "one or more selected customization options are invalid".into(),
        ));
    }

    Ok(selection)
}

fn map_cart_item(row: &Row) -> CartItem {
    let selected_customizations_json: Value = row.get(7);
    CartItem {
        id: row.get(0),
        product_id: row.get(1),
        product_name: row.get(2),
        images: row.get(3),
        quantity: row.get(4),
        unit_price: row.get(5),
        line_total: row.get(6),
        selected_customizations: parse_selected_customizations(selected_customizations_json),
    }
}

fn map_order_item(row: &Row) -> CartItem {
    let selected_customizations_json: Value = row.get(7);
    CartItem {
        id: row.get(0),
        product_id: row.get(1),
        product_name: row.get(2),
        images: row.get(3),
        quantity: row.get(4),
        unit_price: row.get(5),
        line_total: row.get(6),
        selected_customizations: parse_selected_customizations(selected_customizations_json),
    }
}

fn parse_selected_customizations(value: Value) -> Vec<SelectedCustomizationSnapshot> {
    serde_json::from_value(value).unwrap_or_default()
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
        id: row.get(0),
        user_id: row.get(1),
        full_name: row.get(2),
        phone: row.get(3),
        line_1: row.get(4),
        line_2: row.get(5),
        city: row.get(6),
        state: row.get(7),
        postal_code: row.get(8),
        country: row.get(9),
        landmark: row.get(10),
        is_default: row.get(11),
    })
    .ok_or_else(|| AppError::NotFound("address not found".into()))
}

fn validate_qty(quantity: i32) -> Result<(), AppError> {
    if quantity <= 0 {
        return Err(AppError::BadRequest(
            "quantity must be greater than zero".into(),
        ));
    }
    Ok(())
}

#[derive(Clone)]
struct GroupAccumulator {
    group_id: String,
    group_name: String,
    min_select: i32,
    max_select: i32,
    sort_order: i32,
    options: Vec<OptionAccumulator>,
}

#[derive(Clone)]
struct OptionAccumulator {
    option_id: String,
    option_name: String,
    price_delta: f64,
    sort_order: i32,
}

#[cfg(test)]
mod tests {
    use super::*;

    fn sample_rows() -> Vec<CustomizationGroupRow> {
        vec![
            CustomizationGroupRow {
                group_id: "group-1".into(),
                group_name: "Strength".into(),
                min_select: 0,
                max_select: 1,
                sort_order: 1,
                option_id: Some("option-a".into()),
                option_name: Some("Light".into()),
                option_price_delta: Some(0.0),
                option_sort_order: Some(1),
            },
            CustomizationGroupRow {
                group_id: "group-1".into(),
                group_name: "Strength".into(),
                min_select: 0,
                max_select: 1,
                sort_order: 1,
                option_id: Some("option-b".into()),
                option_name: Some("Bold".into()),
                option_price_delta: Some(18.0),
                option_sort_order: Some(2),
            },
            CustomizationGroupRow {
                group_id: "group-2".into(),
                group_name: "Finish".into(),
                min_select: 0,
                max_select: 1,
                sort_order: 2,
                option_id: Some("option-c".into()),
                option_name: Some("Honey".into()),
                option_price_delta: Some(10.0),
                option_sort_order: Some(1),
            },
        ]
    }

    #[test]
    fn resolves_snapshot_and_price() {
        let selection = resolve_customization_selection(
            &sample_rows(),
            &["option-b".to_string(), "option-c".to_string()],
        )
        .expect("selection should resolve");

        assert_eq!(selection.len(), 2);
        assert_eq!(selection[0].group_name, "Strength");
        assert_eq!(selection[0].option_name, "Bold");
        assert_eq!(selection[1].group_name, "Finish");
        assert_eq!(selection[1].price_delta, 10.0);
    }

    #[test]
    fn rejects_unknown_option() {
        let error = resolve_customization_selection(&sample_rows(), &["missing".into()])
            .unwrap_err();
        assert!(error.to_string().contains("invalid"));
    }

    #[test]
    fn rejects_duplicate_option() {
        let error = resolve_customization_selection(
            &sample_rows(),
            &["option-b".into(), "option-b".into()],
        )
        .unwrap_err();
        assert!(error.to_string().contains("duplicate"));
    }
}
