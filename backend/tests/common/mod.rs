//! Common test utilities and helpers

#![allow(dead_code)]

use sqlx::{postgres::PgPoolOptions, PgPool};
use uuid::Uuid;

/// Test database URL - uses a separate test database
pub fn test_database_url() -> String {
    std::env::var("TEST_DATABASE_URL")
        .unwrap_or_else(|_| "postgres://postgres:postgres@localhost:5432/teatime_test".to_string())
}

/// Test database context that handles cleanup automatically
pub struct TestDb {
    pub pool: PgPool,
    pub db_name: String,
    pub base_url: String,
}

impl TestDb {
    /// Drop the test database - call this after tests complete
    pub async fn cleanup(self) {
        // Close all connections first
        self.pool.close().await;

        // Connect to postgres database to drop the test database
        if let Ok(base_pool) = PgPoolOptions::new()
            .max_connections(1)
            .connect(&format!("{}/postgres", self.base_url))
            .await
        {
            // Terminate any remaining connections
            let _ = sqlx::query(&format!(
                "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '{}'",
                self.db_name
            ))
            .execute(&base_pool)
            .await;

            // Drop the database
            if let Err(e) = sqlx::query(&format!("DROP DATABASE IF EXISTS \"{}\"", self.db_name))
                .execute(&base_pool)
                .await
            {
                eprintln!(
                    "Warning: Failed to drop test database {}: {}",
                    self.db_name, e
                );
            }
            base_pool.close().await;
        }
    }
}

/// Create a test database pool with cleanup support
pub async fn create_test_pool() -> PgPool {
    create_test_db().await.pool
}

/// Create a test database with cleanup support
pub async fn create_test_db() -> TestDb {
    let base_url = std::env::var("TEST_DATABASE_BASE_URL")
        .unwrap_or_else(|_| "postgres://postgres:postgres@localhost:5432".to_string());

    let db_name = format!("teatime_test_{}", Uuid::new_v4().simple());
    let database_url = format!("{}/{}", base_url, db_name);

    // Connect to base postgres to create unique DB
    let base_pool = PgPoolOptions::new()
        .max_connections(1)
        .connect(&format!("{}/postgres", base_url))
        .await
        .expect("Failed to connect to postgres database");

    sqlx::query(&format!("CREATE DATABASE \"{}\"", db_name))
        .execute(&base_pool)
        .await
        .expect("Failed to create unique test database");

    base_pool.close().await;

    let pool = PgPoolOptions::new()
        .max_connections(5)
        .connect(&database_url)
        .await
        .expect("Failed to connect to test database");

    TestDb {
        pool,
        db_name,
        base_url,
    }
}

/// Run migrations on the test database
pub async fn run_migrations(pool: &PgPool) {
    sqlx::migrate!("./db/migration")
        .run(pool)
        .await
        .expect("Failed to run migrations");
}

/// Clean up test data (call before each test)
pub async fn cleanup_test_data(pool: &PgPool) {
    // Delete in order of dependencies
    let _ = sqlx::query("DELETE FROM order_status_history")
        .execute(pool)
        .await;
    let _ = sqlx::query("DELETE FROM payments").execute(pool).await;
    let _ = sqlx::query("DELETE FROM order_item_customizations")
        .execute(pool)
        .await;
    let _ = sqlx::query("DELETE FROM order_items").execute(pool).await;
    let _ = sqlx::query("DELETE FROM orders").execute(pool).await;
    let _ = sqlx::query("DELETE FROM cart_item_customizations")
        .execute(pool)
        .await;
    let _ = sqlx::query("DELETE FROM cart_items").execute(pool).await;
    let _ = sqlx::query("DELETE FROM carts").execute(pool).await;
    let _ = sqlx::query("DELETE FROM favorites").execute(pool).await;
    let _ = sqlx::query("DELETE FROM addresses").execute(pool).await;
    let _ = sqlx::query("DELETE FROM product_customizations")
        .execute(pool)
        .await;
    let _ = sqlx::query("DELETE FROM customization_options")
        .execute(pool)
        .await;
    let _ = sqlx::query("DELETE FROM customization_groups")
        .execute(pool)
        .await;
    let _ = sqlx::query("DELETE FROM products").execute(pool).await;
    let _ = sqlx::query("DELETE FROM users").execute(pool).await;
}

/// Test user data
pub struct TestUser {
    pub id: Uuid,
    pub email: String,
    pub name: String,
    pub phone: String,
}

impl Default for TestUser {
    fn default() -> Self {
        Self {
            id: Uuid::new_v4(),
            email: format!("test_{}@example.com", Uuid::new_v4()),
            name: "Test User".to_string(),
            phone: "+919876543210".to_string(),
        }
    }
}

impl TestUser {
    pub async fn insert(&self, pool: &PgPool) -> Result<(), sqlx::Error> {
        let salt = argon2::password_hash::SaltString::generate(
            &mut argon2::password_hash::rand_core::OsRng,
        );
        let argon2 = argon2::Argon2::default();
        let password_hash =
            argon2::password_hash::PasswordHasher::hash_password(&argon2, b"test", &salt)
                .expect("Failed to hash test password")
                .to_string();

        sqlx::query(
            r#"
            INSERT INTO users (id, email, name, phone, password_hash, role)
            VALUES ($1, $2, $3, $4, $5, 'customer')
            "#,
        )
        .bind(self.id)
        .bind(&self.email)
        .bind(&self.name)
        .bind(&self.phone)
        .bind(password_hash)
        .execute(pool)
        .await?;
        Ok(())
    }
}

/// Test address data
pub struct TestAddress {
    pub id: Uuid,
    pub user_id: Uuid,
    pub label: String,
    pub recipient_name: String,
    pub phone_number: String,
    pub street_address: String,
    pub city: String,
    pub state: String,
    pub postal_code: String,
    pub is_default: bool,
}

impl TestAddress {
    pub fn new(user_id: Uuid) -> Self {
        Self {
            id: Uuid::new_v4(),
            user_id,
            label: "Home".to_string(),
            recipient_name: "Test Recipient".to_string(),
            phone_number: "+919876543210".to_string(),
            street_address: "123 Test Street".to_string(),
            city: "Madurai".to_string(),
            state: "Tamil Nadu".to_string(),
            postal_code: "625001".to_string(),
            is_default: true,
        }
    }

    pub async fn insert(&self, pool: &PgPool) -> Result<(), sqlx::Error> {
        sqlx::query(
            r#"
            INSERT INTO addresses (id, user_id, label, recipient_name, phone_number,
                                   street_address, city, state, postal_code, is_default)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            "#,
        )
        .bind(self.id)
        .bind(self.user_id)
        .bind(&self.label)
        .bind(&self.recipient_name)
        .bind(&self.phone_number)
        .bind(&self.street_address)
        .bind(&self.city)
        .bind(&self.state)
        .bind(&self.postal_code)
        .bind(self.is_default)
        .execute(pool)
        .await?;
        Ok(())
    }
}

/// Test product data
pub struct TestProduct {
    pub id: Uuid,
    pub name: String,
    pub description: Option<String>,
    pub base_price: f64,
    pub category: serde_json::Value,
    pub image_urls: Vec<String>,
    pub is_active: bool,
    pub stock_quantity: i32,
}

impl Default for TestProduct {
    fn default() -> Self {
        Self {
            id: Uuid::new_v4(),
            name: "Test Tea".to_string(),
            description: Some("A delicious test tea".to_string()),
            base_price: 50.0,
            category: serde_json::json!(["Tea"]),
            image_urls: vec!["/test-tea.jpg".to_string()],
            is_active: true,
            stock_quantity: 100,
        }
    }
}

impl TestProduct {
    pub async fn insert(&self, pool: &PgPool) -> Result<(), sqlx::Error> {
        sqlx::query(
            r#"
            INSERT INTO products (id, name, description, base_price, category, image_urls, is_active, stock_quantity)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            "#,
        )
        .bind(self.id)
        .bind(&self.name)
        .bind(&self.description)
        .bind(self.base_price)
        .bind(&self.category)
        .bind(&self.image_urls)
        .bind(self.is_active)
        .bind(self.stock_quantity)
        .execute(pool)
        .await?;
        Ok(())
    }
}

/// Test customization group
pub struct TestCustomizationGroup {
    pub id: Uuid,
    pub name: String,
    pub input_type: String,
    pub is_required: bool,
}

impl Default for TestCustomizationGroup {
    fn default() -> Self {
        Self {
            id: Uuid::new_v4(),
            name: "Sugar".to_string(),
            input_type: "radio".to_string(),
            is_required: true,
        }
    }
}

impl TestCustomizationGroup {
    pub async fn insert(&self, pool: &PgPool) -> Result<(), sqlx::Error> {
        sqlx::query(
            r#"
            INSERT INTO customization_groups (id, name, input_type, is_required)
            VALUES ($1, $2, $3, $4)
            "#,
        )
        .bind(self.id)
        .bind(&self.name)
        .bind(&self.input_type)
        .bind(self.is_required)
        .execute(pool)
        .await?;
        Ok(())
    }
}

/// Test customization option
pub struct TestCustomizationOption {
    pub id: Uuid,
    pub group_id: Uuid,
    pub name: String,
    pub price_modifier: f64,
    pub is_default: bool,
}

impl TestCustomizationOption {
    pub fn new(group_id: Uuid, name: &str, price_modifier: f64) -> Self {
        Self {
            id: Uuid::new_v4(),
            group_id,
            name: name.to_string(),
            price_modifier,
            is_default: false,
        }
    }

    pub async fn insert(&self, pool: &PgPool) -> Result<(), sqlx::Error> {
        sqlx::query(
            r#"
            INSERT INTO customization_options (id, group_id, name, price_modifier, is_default)
            VALUES ($1, $2, $3, $4, $5)
            "#,
        )
        .bind(self.id)
        .bind(self.group_id)
        .bind(&self.name)
        .bind(self.price_modifier)
        .bind(self.is_default)
        .execute(pool)
        .await?;
        Ok(())
    }
}

/// Create a cart with items for a user
pub async fn create_cart_with_items(
    pool: &PgPool,
    user_id: Uuid,
    product_id: Uuid,
    quantity: i32,
    customizations: Vec<(Uuid, Uuid, f64)>, // (group_id, option_id, price_modifier)
) -> Result<Uuid, sqlx::Error> {
    let cart_id = Uuid::new_v4();

    // Create cart
    sqlx::query("INSERT INTO carts (id, user_id) VALUES ($1, $2)")
        .bind(cart_id)
        .bind(user_id)
        .execute(pool)
        .await?;

    // Create cart item
    let cart_item_id = Uuid::new_v4();
    sqlx::query(
        "INSERT INTO cart_items (id, cart_id, product_id, quantity) VALUES ($1, $2, $3, $4)",
    )
    .bind(cart_item_id)
    .bind(cart_id)
    .bind(product_id)
    .bind(quantity)
    .execute(pool)
    .await?;

    // Create customizations
    for (group_id, option_id, price_modifier) in customizations {
        let cust_id = Uuid::new_v4();
        sqlx::query(
            r#"
            INSERT INTO cart_item_customizations (id, cart_item_id, group_id, option_id, price_modifier)
            VALUES ($1, $2, $3, $4, $5)
            "#
        )
        .bind(cust_id)
        .bind(cart_item_id)
        .bind(group_id)
        .bind(option_id)
        .bind(price_modifier)
        .execute(pool)
        .await?;
    }

    Ok(cart_id)
}

/// Create a test order directly in the database
pub async fn create_test_order(
    pool: &PgPool,
    user_id: Uuid,
    address_id: Uuid,
    status: &str,
    total_amount: f64,
) -> Result<Uuid, sqlx::Error> {
    let order_id = Uuid::new_v4();
    let order_number = format!(
        "ORD-TEST-{}",
        Uuid::new_v4().to_string()[..8].to_uppercase()
    );

    sqlx::query(
        r#"
        INSERT INTO orders (id, user_id, address_id, order_number, status,
                           subtotal, tax_cgst, tax_sgst, delivery_charge, total_amount)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        "#,
    )
    .bind(order_id)
    .bind(user_id)
    .bind(address_id)
    .bind(&order_number)
    .bind(status)
    .bind(total_amount * 0.9) // subtotal
    .bind(total_amount * 0.05) // cgst
    .bind(total_amount * 0.05) // sgst
    .bind(30.0) // delivery
    .bind(total_amount)
    .execute(pool)
    .await?;

    Ok(order_id)
}

/// Create a test payment for an order
pub async fn create_test_payment(
    pool: &PgPool,
    order_id: Uuid,
    status: &str,
    amount: f64,
) -> Result<Uuid, sqlx::Error> {
    let payment_id = Uuid::new_v4();
    let razorpay_order_id = format!(
        "order_test_{}",
        Uuid::new_v4().to_string()[..12].to_uppercase()
    );

    sqlx::query(
        r#"
        INSERT INTO payments (id, order_id, razorpay_order_id, amount, status)
        VALUES ($1, $2, $3, $4, $5)
        "#,
    )
    .bind(payment_id)
    .bind(order_id)
    .bind(&razorpay_order_id)
    .bind(amount)
    .bind(status)
    .execute(pool)
    .await?;

    Ok(payment_id)
}

/// Helper to check if order exists with given status
pub async fn order_has_status(pool: &PgPool, order_id: Uuid, expected_status: &str) -> bool {
    let result = sqlx::query_scalar::<_, String>("SELECT status FROM orders WHERE id = $1")
        .bind(order_id)
        .fetch_optional(pool)
        .await
        .ok()
        .flatten();

    result.as_deref() == Some(expected_status)
}

/// Helper to check payment status
pub async fn payment_has_status(pool: &PgPool, order_id: Uuid, expected_status: &str) -> bool {
    let result = sqlx::query_scalar::<_, String>("SELECT status FROM payments WHERE order_id = $1")
        .bind(order_id)
        .fetch_optional(pool)
        .await
        .ok()
        .flatten();

    result.as_deref() == Some(expected_status)
}

/// Count orders for a user
pub async fn count_user_orders(pool: &PgPool, user_id: Uuid) -> i64 {
    sqlx::query_scalar::<_, i64>("SELECT COUNT(*) FROM orders WHERE user_id = $1")
        .bind(user_id)
        .fetch_one(pool)
        .await
        .unwrap_or(0)
}

/// Count payments for a user
pub async fn count_user_payments(pool: &PgPool, user_id: Uuid) -> i64 {
    sqlx::query_scalar::<_, i64>(
        "SELECT COUNT(*) FROM payments p JOIN orders o ON p.order_id = o.id WHERE o.user_id = $1",
    )
    .bind(user_id)
    .fetch_one(pool)
    .await
    .unwrap_or(0)
}
