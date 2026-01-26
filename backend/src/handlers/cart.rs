use crate::auth::{AuthSession, RequiredAuthUser};
use crate::domain::cart::{
    AddToCartRequest, Cart, CartCustomization, CartCustomizationDto, CartDto, CartItemDto,
    MergeCartRequest, UpdateCartItemRequest,
};
use crate::error::AppError;
use crate::state::AppState;
use axum::{
    extract::{Path, State},
    Json,
};
use sqlx::{Row, SqlitePool};
use tower_sessions::Session;
use uuid::Uuid;
use validator::Validate;

// --- Repository Helpers ---

async fn get_cart_from_db(
    pool: &SqlitePool,
    user_id: Option<&str>,
    session_id: &str,
) -> Result<Cart, AppError> {
    // 1. Find Cart ID
    let cart_row = if let Some(uid) = user_id {
        sqlx::query("SELECT id FROM carts WHERE user_id = ?")
            .bind(uid)
            .fetch_optional(pool)
            .await?
    } else {
        sqlx::query("SELECT id FROM carts WHERE session_id = ? AND user_id IS NULL")
            .bind(session_id)
            .fetch_optional(pool)
            .await?
    };

    let cart_id: String = if let Some(row) = cart_row {
        row.try_get("id")?
    } else {
        return Ok(Cart::new());
    };

    // 2. Fetch Items
    let items = sqlx::query(
        r#"
        SELECT ci.id, ci.product_id, ci.quantity, p.base_price
        FROM cart_items ci
        JOIN products p ON ci.product_id = p.id
        WHERE ci.cart_id = ?
        "#,
    )
    .bind(&cart_id)
    .fetch_all(pool)
    .await?;

    let mut cart_items = Vec::new();
    for row in items {
        let item_id: String = row.try_get("id")?;
        let product_id: String = row.try_get("product_id")?;
        let quantity: i32 = row.try_get("quantity")?;
        let unit_price: f64 = row.try_get("base_price")?;

        // 3. Fetch Customizations for Item
        let custs = sqlx::query(
            r#"
            SELECT group_id, option_id, price_modifier
            FROM cart_item_customizations
            WHERE cart_item_id = ?
            "#,
        )
        .bind(&item_id)
        .fetch_all(pool)
        .await?;

        let mut customizations = custs
            .into_iter()
            .map(|r| {
                Ok(CartCustomization {
                    group_id: r.try_get("group_id")?,
                    option_id: r.try_get("option_id")?,
                    price_modifier: r.try_get("price_modifier")?,
                })
            })
            .collect::<Result<Vec<_>, sqlx::Error>>()?;

        customizations.sort_by(|a, b| {
            a.group_id
                .cmp(&b.group_id)
                .then(a.option_id.cmp(&b.option_id))
        });

        cart_items.push(crate::domain::cart::CartItem {
            id: Some(item_id),
            product_id,
            quantity,
            unit_price,
            customizations,
        });
    }

    Ok(Cart { items: cart_items })
}

async fn save_cart_to_db(
    pool: &SqlitePool,
    cart: &Cart,
    user_id: Option<&str>,
    session_id: &str,
) -> Result<(), AppError> {
    let mut tx = pool.begin().await?;

    // 1. Get or Create Cart ID
    let cart_id_row = if let Some(uid) = user_id {
        sqlx::query("SELECT id FROM carts WHERE user_id = ?")
            .bind(uid)
            .fetch_optional(&mut *tx)
            .await?
    } else {
        sqlx::query("SELECT id FROM carts WHERE session_id = ? AND user_id IS NULL")
            .bind(session_id)
            .fetch_optional(&mut *tx)
            .await?
    };

    let cart_id: String = if let Some(row) = cart_id_row {
        row.try_get("id")?
    } else {
        // Create Cart with UUID
        let new_cart_id = Uuid::new_v4().to_string();
        sqlx::query("INSERT INTO carts (id, user_id, session_id) VALUES (?, ?, ?)")
            .bind(&new_cart_id)
            .bind(user_id)
            .bind(session_id)
            .execute(&mut *tx)
            .await?;
        new_cart_id
    };

    // 2. Sync Items - Delete all items and re-insert
    sqlx::query("DELETE FROM cart_items WHERE cart_id = ?")
        .bind(&cart_id)
        .execute(&mut *tx)
        .await?;

    for item in &cart.items {
        let new_item_id = Uuid::new_v4().to_string();
        sqlx::query(
            "INSERT INTO cart_items (id, cart_id, product_id, quantity) VALUES (?, ?, ?, ?)",
        )
        .bind(&new_item_id)
        .bind(&cart_id)
        .bind(&item.product_id)
        .bind(item.quantity)
        .execute(&mut *tx)
        .await?;

        for cust in &item.customizations {
            let cust_id = Uuid::new_v4().to_string();
            sqlx::query(
                "INSERT INTO cart_item_customizations (id, cart_item_id, group_id, option_id, price_modifier) VALUES (?, ?, ?, ?, ?)"
            )
            .bind(&cust_id)
            .bind(&new_item_id)
            .bind(&cust.group_id)
            .bind(&cust.option_id)
            .bind(cust.price_modifier)
            .execute(&mut *tx)
            .await?;
        }
    }

    tx.commit().await?;
    Ok(())
}

async fn get_cart_dto(pool: &SqlitePool, cart: Cart) -> Result<CartDto, AppError> {
    let mut item_dtos = Vec::new();
    let total = cart.get_total();

    for item in cart.items {
        // Fetch product details
        let product = sqlx::query("SELECT name, image_url FROM products WHERE id = ?")
            .bind(&item.product_id)
            .fetch_one(pool)
            .await?;

        let name: String = product.try_get("name")?;
        let image_url: Option<String> = product.try_get("image_url")?;

        // Enrich Customizations
        let mut cust_dtos = Vec::new();
        for cust in &item.customizations {
            let details = sqlx::query(
                "SELECT cg.name as group_name, co.name as option_name
                 FROM customization_groups cg
                 JOIN customization_options co ON co.group_id = cg.id
                 WHERE cg.id = ? AND co.id = ?",
            )
            .bind(&cust.group_id)
            .bind(&cust.option_id)
            .fetch_optional(pool)
            .await?;

            if let Some(d) = details {
                cust_dtos.push(CartCustomizationDto {
                    group_name: d.try_get("group_name")?,
                    option_name: d.try_get("option_name")?,
                    price_modifier: cust.price_modifier,
                });
            }
        }

        let customization_price: f64 = item.customizations.iter().map(|c| c.price_modifier).sum();
        let total_price = (item.unit_price + customization_price) * item.quantity as f64;

        item_dtos.push(CartItemDto {
            id: item.id,
            product_id: item.product_id,
            name,
            quantity: item.quantity,
            unit_price: item.unit_price,
            customizations: cust_dtos,
            total_price,
            image_url,
        });
    }

    Ok(CartDto {
        items: item_dtos,
        total,
    })
}

// --- Handlers ---

pub async fn get_cart(
    auth_session: AuthSession,
    session: Session,
    State(state): State<AppState>,
) -> Result<Json<CartDto>, AppError> {
    let user_id = auth_session.user.as_ref().map(|u| u.id.as_str());
    let session_id = session
        .id()
        .ok_or(AppError::InternalServerError("No session".into()))?
        .to_string();

    let cart = get_cart_from_db(&state.db, user_id, &session_id).await?;
    let dto = get_cart_dto(&state.db, cart).await?;

    Ok(Json(dto))
}

pub async fn add_to_cart(
    auth_session: AuthSession,
    session: Session,
    State(state): State<AppState>,
    Json(payload): Json<AddToCartRequest>,
) -> Result<Json<CartDto>, AppError> {
    payload
        .validate()
        .map_err(|e| AppError::BadRequest(e.to_string()))?;

    let user_id = auth_session.user.as_ref().map(|u| u.id.as_str());
    let session_id = session
        .id()
        .ok_or(AppError::InternalServerError("No session".into()))?
        .to_string();

    // 1. Fetch Product Price
    let product = sqlx::query("SELECT base_price FROM products WHERE id = ?")
        .bind(&payload.product_id)
        .fetch_optional(&state.db)
        .await?
        .ok_or(AppError::NotFound("Product not found".into()))?;

    let unit_price: f64 = product.try_get("base_price")?;

    // 2. Resolve Customizations
    let mut customizations = Vec::new();
    for cust_req in payload.customizations {
        let opt = sqlx::query(
            "SELECT price_modifier FROM customization_options WHERE id = ? AND group_id = ?",
        )
        .bind(&cust_req.option_id)
        .bind(&cust_req.group_id)
        .fetch_optional(&state.db)
        .await?
        .ok_or(AppError::BadRequest("Invalid customization option".into()))?;

        customizations.push(CartCustomization {
            group_id: cust_req.group_id,
            option_id: cust_req.option_id,
            price_modifier: opt.try_get("price_modifier")?,
        });
    }

    // Sort customizations to ensure consistent matching regardless of input order
    customizations.sort_by(|a, b| {
        a.group_id
            .cmp(&b.group_id)
            .then(a.option_id.cmp(&b.option_id))
    });

    // 3. Load Cart
    let mut cart = get_cart_from_db(&state.db, user_id, &session_id).await?;

    // 4. Update Domain
    cart.add_item(
        payload.product_id,
        payload.quantity,
        unit_price,
        customizations,
    );

    // 5. Save
    save_cart_to_db(&state.db, &cart, user_id, &session_id).await?;

    // 6. Reload to get fresh IDs and DTO
    let updated_cart = get_cart_from_db(&state.db, user_id, &session_id).await?;
    let dto = get_cart_dto(&state.db, updated_cart).await?;

    Ok(Json(dto))
}

pub async fn update_cart_item(
    Path(item_id): Path<String>,
    auth_session: AuthSession,
    session: Session,
    State(state): State<AppState>,
    Json(payload): Json<UpdateCartItemRequest>,
) -> Result<Json<CartDto>, AppError> {
    payload
        .validate()
        .map_err(|e| AppError::BadRequest(e.to_string()))?;

    let user_id = auth_session.user.as_ref().map(|u| u.id.as_str());
    let session_id = session
        .id()
        .ok_or(AppError::InternalServerError("No session".into()))?
        .to_string();

    let mut cart = get_cart_from_db(&state.db, user_id, &session_id).await?;

    // Domain Update
    cart.update_quantity(&item_id, payload.quantity);

    // Save
    save_cart_to_db(&state.db, &cart, user_id, &session_id).await?;

    let updated_cart = get_cart_from_db(&state.db, user_id, &session_id).await?;
    let dto = get_cart_dto(&state.db, updated_cart).await?;

    Ok(Json(dto))
}

pub async fn remove_cart_item(
    Path(item_id): Path<String>,
    auth_session: AuthSession,
    session: Session,
    State(state): State<AppState>,
) -> Result<Json<CartDto>, AppError> {
    let user_id = auth_session.user.as_ref().map(|u| u.id.as_str());
    let session_id = session
        .id()
        .ok_or(AppError::InternalServerError("No session".into()))?
        .to_string();

    let mut cart = get_cart_from_db(&state.db, user_id, &session_id).await?;

    // Domain Update
    cart.remove_item(&item_id);

    // Save
    save_cart_to_db(&state.db, &cart, user_id, &session_id).await?;

    let updated_cart = get_cart_from_db(&state.db, user_id, &session_id).await?;
    let dto = get_cart_dto(&state.db, updated_cart).await?;

    Ok(Json(dto))
}

/// Merge guest cart items into authenticated user's cart.
/// Called after login/signup to preserve guest cart items.
pub async fn merge_cart(
    auth_user: RequiredAuthUser,
    session: Session,
    State(state): State<AppState>,
    Json(payload): Json<MergeCartRequest>,
) -> Result<Json<CartDto>, AppError> {
    let user_id = auth_user.0.id.as_str();
    let session_id = session
        .id()
        .ok_or(AppError::InternalServerError("No session".into()))?
        .to_string();

    // Load user's existing cart
    let mut cart = get_cart_from_db(&state.db, Some(user_id), &session_id).await?;

    // Merge each guest cart item
    for item in payload.items {
        // Fetch product price
        let product = sqlx::query("SELECT base_price FROM products WHERE id = ?")
            .bind(&item.product_id)
            .fetch_optional(&state.db)
            .await?;

        let unit_price: f64 = match product {
            Some(p) => p.try_get("base_price")?,
            None => continue, // Skip invalid products
        };

        // Resolve customizations
        let mut customizations = Vec::new();
        for cust_req in item.customizations {
            let opt = sqlx::query(
                "SELECT price_modifier FROM customization_options WHERE id = ? AND group_id = ?",
            )
            .bind(&cust_req.option_id)
            .bind(&cust_req.group_id)
            .fetch_optional(&state.db)
            .await?;

            if let Some(opt_row) = opt {
                customizations.push(CartCustomization {
                    group_id: cust_req.group_id,
                    option_id: cust_req.option_id,
                    price_modifier: opt_row.try_get("price_modifier")?,
                });
            }
        }

        // Sort customizations for consistent matching
        customizations.sort_by(|a, b| {
            a.group_id
                .cmp(&b.group_id)
                .then(a.option_id.cmp(&b.option_id))
        });

        // Add to cart (domain handles merging duplicates)
        cart.add_item(item.product_id, item.quantity, unit_price, customizations);
    }

    // Save merged cart
    save_cart_to_db(&state.db, &cart, Some(user_id), &session_id).await?;

    // Return updated cart DTO
    let updated_cart = get_cart_from_db(&state.db, Some(user_id), &session_id).await?;
    let dto = get_cart_dto(&state.db, updated_cart).await?;

    Ok(Json(dto))
}
