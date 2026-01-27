//! Integration tests for Order and Payment APIs
//!
//! These tests require a running PostgreSQL database.
//! Set TEST_DATABASE_URL environment variable or use default:
//! postgres://postgres:postgres@localhost:5432/teatime_test

mod common;

use common::*;
use sqlx::PgPool;
use uuid::Uuid;

/// Test fixture that sets up a clean database state
struct TestFixture {
    pool: PgPool,
    user: TestUser,
    address: TestAddress,
    product: TestProduct,
    customization_group: TestCustomizationGroup,
    customization_option: TestCustomizationOption,
}

impl TestFixture {
    async fn new() -> Self {
        let pool = create_test_pool().await;
        run_migrations(&pool).await;
        cleanup_test_data(&pool).await;

        let user = TestUser::default();
        user.insert(&pool)
            .await
            .expect("Failed to insert test user");

        let address = TestAddress::new(user.id);
        address
            .insert(&pool)
            .await
            .expect("Failed to insert test address");

        let product = TestProduct::default();
        product
            .insert(&pool)
            .await
            .expect("Failed to insert test product");

        let customization_group = TestCustomizationGroup::default();
        customization_group
            .insert(&pool)
            .await
            .expect("Failed to insert customization group");

        let customization_option =
            TestCustomizationOption::new(customization_group.id, "Extra Sugar", 5.0);
        customization_option
            .insert(&pool)
            .await
            .expect("Failed to insert customization option");

        Self {
            pool,
            user,
            address,
            product,
            customization_group,
            customization_option,
        }
    }

    async fn cleanup(&self) {
        cleanup_test_data(&self.pool).await;
    }
}

// ============================================================================
// Order Creation Tests
// ============================================================================

mod order_creation_tests {
    use super::*;

    #[tokio::test]
    async fn test_create_order_with_cart_items() {
        let fixture = TestFixture::new().await;

        // Create cart with items
        let customizations = vec![(
            fixture.customization_group.id,
            fixture.customization_option.id,
            5.0,
        )];
        create_cart_with_items(
            &fixture.pool,
            fixture.user.id,
            fixture.product.id,
            2,
            customizations,
        )
        .await
        .expect("Failed to create cart");

        // Verify cart exists
        let cart_count: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM carts WHERE user_id = $1")
            .bind(fixture.user.id)
            .fetch_one(&fixture.pool)
            .await
            .unwrap();
        assert_eq!(cart_count, 1);

        // Verify cart items
        let item_count: i64 = sqlx::query_scalar(
            r#"SELECT COUNT(*) FROM cart_items ci
               JOIN carts c ON ci.cart_id = c.id
               WHERE c.user_id = $1"#,
        )
        .bind(fixture.user.id)
        .fetch_one(&fixture.pool)
        .await
        .unwrap();
        assert_eq!(item_count, 1);

        fixture.cleanup().await;
    }

    #[tokio::test]
    async fn test_order_number_generation() {
        let fixture = TestFixture::new().await;

        // Generate order number using the database function
        let order_number1: String = sqlx::query_scalar("SELECT generate_order_number()")
            .fetch_one(&fixture.pool)
            .await
            .expect("Failed to generate order number");

        assert!(order_number1.starts_with("ORD-"));
        assert!(order_number1.contains("-0001"));

        // Create an order to increment the counter
        let _order_id = create_test_order(
            &fixture.pool,
            fixture.user.id,
            fixture.address.id,
            "pending",
            100.0,
        )
        .await
        .expect("Failed to create order");

        // Generate another number
        let order_number2: String = sqlx::query_scalar("SELECT generate_order_number()")
            .fetch_one(&fixture.pool)
            .await
            .expect("Failed to generate order number");

        // Should have different sequence number
        assert!(order_number2.starts_with("ORD-"));

        fixture.cleanup().await;
    }

    #[tokio::test]
    async fn test_order_with_multiple_items() {
        let fixture = TestFixture::new().await;

        // Create second product
        let product2 = TestProduct {
            id: Uuid::new_v4(),
            name: "Test Coffee".to_string(),
            base_price: 75.0,
            ..Default::default()
        };
        product2
            .insert(&fixture.pool)
            .await
            .expect("Failed to insert second product");

        // Create cart
        let cart_id = Uuid::new_v4();
        sqlx::query("INSERT INTO carts (id, user_id) VALUES ($1, $2)")
            .bind(cart_id)
            .bind(fixture.user.id)
            .execute(&fixture.pool)
            .await
            .expect("Failed to create cart");

        // Add first item
        let item1_id = Uuid::new_v4();
        sqlx::query(
            "INSERT INTO cart_items (id, cart_id, product_id, quantity) VALUES ($1, $2, $3, $4)",
        )
        .bind(item1_id)
        .bind(cart_id)
        .bind(fixture.product.id)
        .bind(2)
        .execute(&fixture.pool)
        .await
        .expect("Failed to add item 1");

        // Add second item
        let item2_id = Uuid::new_v4();
        sqlx::query(
            "INSERT INTO cart_items (id, cart_id, product_id, quantity) VALUES ($1, $2, $3, $4)",
        )
        .bind(item2_id)
        .bind(cart_id)
        .bind(product2.id)
        .bind(1)
        .execute(&fixture.pool)
        .await
        .expect("Failed to add item 2");

        // Verify multiple items
        let count: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM cart_items WHERE cart_id = $1")
            .bind(cart_id)
            .fetch_one(&fixture.pool)
            .await
            .unwrap();
        assert_eq!(count, 2);

        fixture.cleanup().await;
    }
}

// ============================================================================
// Order Status Tests
// ============================================================================

mod order_status_tests {
    use super::*;

    #[tokio::test]
    async fn test_order_created_with_pending_status() {
        let fixture = TestFixture::new().await;

        let order_id = create_test_order(
            &fixture.pool,
            fixture.user.id,
            fixture.address.id,
            "pending",
            100.0,
        )
        .await
        .expect("Failed to create order");

        assert!(order_has_status(&fixture.pool, order_id, "pending").await);

        fixture.cleanup().await;
    }

    #[tokio::test]
    async fn test_order_status_update_to_confirmed() {
        let fixture = TestFixture::new().await;

        let order_id = create_test_order(
            &fixture.pool,
            fixture.user.id,
            fixture.address.id,
            "pending",
            100.0,
        )
        .await
        .expect("Failed to create order");

        // Update status
        sqlx::query("UPDATE orders SET status = 'confirmed', confirmed_at = NOW() WHERE id = $1")
            .bind(order_id)
            .execute(&fixture.pool)
            .await
            .expect("Failed to update status");

        assert!(order_has_status(&fixture.pool, order_id, "confirmed").await);

        // Verify confirmed_at is set
        let confirmed_at: Option<chrono::DateTime<chrono::Utc>> =
            sqlx::query_scalar("SELECT confirmed_at FROM orders WHERE id = $1")
                .bind(order_id)
                .fetch_one(&fixture.pool)
                .await
                .unwrap();
        assert!(confirmed_at.is_some());

        fixture.cleanup().await;
    }

    #[tokio::test]
    async fn test_order_status_update_to_preparing() {
        let fixture = TestFixture::new().await;

        let order_id = create_test_order(
            &fixture.pool,
            fixture.user.id,
            fixture.address.id,
            "confirmed",
            100.0,
        )
        .await
        .expect("Failed to create order");

        sqlx::query("UPDATE orders SET status = 'preparing', preparing_at = NOW() WHERE id = $1")
            .bind(order_id)
            .execute(&fixture.pool)
            .await
            .expect("Failed to update status");

        assert!(order_has_status(&fixture.pool, order_id, "preparing").await);

        fixture.cleanup().await;
    }

    #[tokio::test]
    async fn test_order_status_update_to_out_for_delivery() {
        let fixture = TestFixture::new().await;

        let order_id = create_test_order(
            &fixture.pool,
            fixture.user.id,
            fixture.address.id,
            "preparing",
            100.0,
        )
        .await
        .expect("Failed to create order");

        sqlx::query(
            r#"UPDATE orders
               SET status = 'out_for_delivery',
                   out_for_delivery_at = NOW(),
                   delivery_partner_name = 'Test Driver',
                   delivery_partner_phone = '+911234567890'
               WHERE id = $1"#,
        )
        .bind(order_id)
        .execute(&fixture.pool)
        .await
        .expect("Failed to update status");

        assert!(order_has_status(&fixture.pool, order_id, "out_for_delivery").await);

        // Verify delivery partner info
        let partner_name: String =
            sqlx::query_scalar("SELECT delivery_partner_name FROM orders WHERE id = $1")
                .bind(order_id)
                .fetch_one(&fixture.pool)
                .await
                .unwrap();
        assert_eq!(partner_name, "Test Driver");

        fixture.cleanup().await;
    }

    #[tokio::test]
    async fn test_order_status_update_to_delivered() {
        let fixture = TestFixture::new().await;

        let order_id = create_test_order(
            &fixture.pool,
            fixture.user.id,
            fixture.address.id,
            "out_for_delivery",
            100.0,
        )
        .await
        .expect("Failed to create order");

        sqlx::query("UPDATE orders SET status = 'delivered', delivered_at = NOW() WHERE id = $1")
            .bind(order_id)
            .execute(&fixture.pool)
            .await
            .expect("Failed to update status");

        assert!(order_has_status(&fixture.pool, order_id, "delivered").await);

        fixture.cleanup().await;
    }

    #[tokio::test]
    async fn test_order_cancellation() {
        let fixture = TestFixture::new().await;

        let order_id = create_test_order(
            &fixture.pool,
            fixture.user.id,
            fixture.address.id,
            "pending",
            100.0,
        )
        .await
        .expect("Failed to create order");

        sqlx::query(
            r#"UPDATE orders
               SET status = 'cancelled',
                   cancelled_at = NOW(),
                   cancellation_reason = 'Customer request'
               WHERE id = $1"#,
        )
        .bind(order_id)
        .execute(&fixture.pool)
        .await
        .expect("Failed to cancel order");

        assert!(order_has_status(&fixture.pool, order_id, "cancelled").await);

        // Verify cancellation reason
        let reason: String =
            sqlx::query_scalar("SELECT cancellation_reason FROM orders WHERE id = $1")
                .bind(order_id)
                .fetch_one(&fixture.pool)
                .await
                .unwrap();
        assert_eq!(reason, "Customer request");

        fixture.cleanup().await;
    }

    #[tokio::test]
    async fn test_order_status_history_tracking() {
        let fixture = TestFixture::new().await;

        let order_id = create_test_order(
            &fixture.pool,
            fixture.user.id,
            fixture.address.id,
            "pending",
            100.0,
        )
        .await
        .expect("Failed to create order");

        // Record status change
        sqlx::query(
            r#"INSERT INTO order_status_history (id, order_id, from_status, to_status, notes)
               VALUES ($1, $2, 'pending', 'confirmed', 'Payment received')"#,
        )
        .bind(Uuid::new_v4())
        .bind(order_id)
        .execute(&fixture.pool)
        .await
        .expect("Failed to record status history");

        // Verify history
        let history_count: i64 =
            sqlx::query_scalar("SELECT COUNT(*) FROM order_status_history WHERE order_id = $1")
                .bind(order_id)
                .fetch_one(&fixture.pool)
                .await
                .unwrap();
        assert_eq!(history_count, 1);

        fixture.cleanup().await;
    }
}

// ============================================================================
// Payment Tests
// ============================================================================

mod payment_tests {
    use super::*;

    #[tokio::test]
    async fn test_create_pending_payment() {
        let fixture = TestFixture::new().await;

        let order_id = create_test_order(
            &fixture.pool,
            fixture.user.id,
            fixture.address.id,
            "pending",
            100.0,
        )
        .await
        .expect("Failed to create order");

        let _payment_id = create_test_payment(&fixture.pool, order_id, "pending", 100.0)
            .await
            .expect("Failed to create payment");

        assert!(payment_has_status(&fixture.pool, order_id, "pending").await);

        fixture.cleanup().await;
    }

    #[tokio::test]
    async fn test_payment_captured() {
        let fixture = TestFixture::new().await;

        let order_id = create_test_order(
            &fixture.pool,
            fixture.user.id,
            fixture.address.id,
            "pending",
            100.0,
        )
        .await
        .expect("Failed to create order");

        let payment_id = create_test_payment(&fixture.pool, order_id, "pending", 100.0)
            .await
            .expect("Failed to create payment");

        // Simulate payment capture
        sqlx::query(
            r#"UPDATE payments
               SET status = 'captured',
                   razorpay_payment_id = 'pay_test_123',
                   razorpay_signature = 'sig_test_456',
                   method = 'upi'
               WHERE id = $1"#,
        )
        .bind(payment_id)
        .execute(&fixture.pool)
        .await
        .expect("Failed to capture payment");

        assert!(payment_has_status(&fixture.pool, order_id, "captured").await);

        // Verify payment details
        let method: Option<String> =
            sqlx::query_scalar("SELECT method FROM payments WHERE id = $1")
                .bind(payment_id)
                .fetch_one(&fixture.pool)
                .await
                .unwrap();
        assert_eq!(method, Some("upi".to_string()));

        fixture.cleanup().await;
    }

    #[tokio::test]
    async fn test_payment_failed() {
        let fixture = TestFixture::new().await;

        let order_id = create_test_order(
            &fixture.pool,
            fixture.user.id,
            fixture.address.id,
            "pending",
            100.0,
        )
        .await
        .expect("Failed to create order");

        let payment_id = create_test_payment(&fixture.pool, order_id, "pending", 100.0)
            .await
            .expect("Failed to create payment");

        // Simulate payment failure
        sqlx::query(
            r#"UPDATE payments
               SET status = 'failed',
                   error_code = 'INSUFFICIENT_FUNDS',
                   error_description = 'Card declined due to insufficient funds'
               WHERE id = $1"#,
        )
        .bind(payment_id)
        .execute(&fixture.pool)
        .await
        .expect("Failed to update payment");

        assert!(payment_has_status(&fixture.pool, order_id, "failed").await);

        // Verify error details
        let error_code: Option<String> =
            sqlx::query_scalar("SELECT error_code FROM payments WHERE id = $1")
                .bind(payment_id)
                .fetch_one(&fixture.pool)
                .await
                .unwrap();
        assert_eq!(error_code, Some("INSUFFICIENT_FUNDS".to_string()));

        fixture.cleanup().await;
    }

    #[tokio::test]
    async fn test_payment_refund() {
        let fixture = TestFixture::new().await;

        let order_id = create_test_order(
            &fixture.pool,
            fixture.user.id,
            fixture.address.id,
            "confirmed",
            100.0,
        )
        .await
        .expect("Failed to create order");

        let payment_id = create_test_payment(&fixture.pool, order_id, "captured", 100.0)
            .await
            .expect("Failed to create payment");

        // Simulate refund
        sqlx::query(
            r#"UPDATE payments
               SET status = 'refunded',
                   refund_id = 'rfnd_test_789',
                   refund_status = 'processed',
                   refund_amount = $1,
                   refunded_at = NOW()
               WHERE id = $2"#,
        )
        .bind(100.0)
        .bind(payment_id)
        .execute(&fixture.pool)
        .await
        .expect("Failed to refund payment");

        assert!(payment_has_status(&fixture.pool, order_id, "refunded").await);

        // Verify refund details
        let refund_amount: Option<f64> =
            sqlx::query_scalar("SELECT refund_amount FROM payments WHERE id = $1")
                .bind(payment_id)
                .fetch_one(&fixture.pool)
                .await
                .unwrap();
        assert_eq!(refund_amount, Some(100.0));

        fixture.cleanup().await;
    }

    #[tokio::test]
    async fn test_razorpay_order_id_unique() {
        let fixture = TestFixture::new().await;

        let order_id1 = create_test_order(
            &fixture.pool,
            fixture.user.id,
            fixture.address.id,
            "pending",
            100.0,
        )
        .await
        .expect("Failed to create order 1");

        let order_id2 = create_test_order(
            &fixture.pool,
            fixture.user.id,
            fixture.address.id,
            "pending",
            150.0,
        )
        .await
        .expect("Failed to create order 2");

        // Create first payment
        create_test_payment(&fixture.pool, order_id1, "pending", 100.0)
            .await
            .expect("Failed to create payment 1");

        // Create second payment with different razorpay_order_id
        create_test_payment(&fixture.pool, order_id2, "pending", 150.0)
            .await
            .expect("Failed to create payment 2");

        // Both payments should exist
        let count: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM payments")
            .fetch_one(&fixture.pool)
            .await
            .unwrap();
        assert_eq!(count, 2);

        fixture.cleanup().await;
    }
}

// ============================================================================
// Order Items Tests
// ============================================================================

mod order_items_tests {
    use super::*;

    #[tokio::test]
    async fn test_order_items_snapshot_product_data() {
        let fixture = TestFixture::new().await;

        let order_id = create_test_order(
            &fixture.pool,
            fixture.user.id,
            fixture.address.id,
            "pending",
            100.0,
        )
        .await
        .expect("Failed to create order");

        // Create order item with snapshot data
        let item_id = Uuid::new_v4();
        sqlx::query(
            r#"INSERT INTO order_items
               (id, order_id, product_id, product_name, product_image_urls,
                quantity, unit_price, customization_price, total_price)
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)"#,
        )
        .bind(item_id)
        .bind(order_id)
        .bind(fixture.product.id)
        .bind(&fixture.product.name)
        .bind(&fixture.product.image_urls)
        .bind(2)
        .bind(50.0)
        .bind(5.0)
        .bind(110.0) // (50 + 5) * 2
        .execute(&fixture.pool)
        .await
        .expect("Failed to create order item");

        // Verify snapshot data
        let product_name: String =
            sqlx::query_scalar("SELECT product_name FROM order_items WHERE id = $1")
                .bind(item_id)
                .fetch_one(&fixture.pool)
                .await
                .unwrap();
        assert_eq!(product_name, fixture.product.name);

        fixture.cleanup().await;
    }

    #[tokio::test]
    async fn test_order_item_customizations_snapshot() {
        let fixture = TestFixture::new().await;

        let order_id = create_test_order(
            &fixture.pool,
            fixture.user.id,
            fixture.address.id,
            "pending",
            100.0,
        )
        .await
        .expect("Failed to create order");

        // Create order item
        let item_id = Uuid::new_v4();
        sqlx::query(
            r#"INSERT INTO order_items
               (id, order_id, product_id, product_name, quantity, unit_price, total_price)
               VALUES ($1, $2, $3, $4, $5, $6, $7)"#,
        )
        .bind(item_id)
        .bind(order_id)
        .bind(fixture.product.id)
        .bind(&fixture.product.name)
        .bind(1)
        .bind(50.0)
        .bind(55.0)
        .execute(&fixture.pool)
        .await
        .expect("Failed to create order item");

        // Create customization snapshot
        let cust_id = Uuid::new_v4();
        sqlx::query(
            r#"INSERT INTO order_item_customizations
               (id, order_item_id, group_id, option_id, group_name, option_name, price_modifier)
               VALUES ($1, $2, $3, $4, $5, $6, $7)"#,
        )
        .bind(cust_id)
        .bind(item_id)
        .bind(fixture.customization_group.id)
        .bind(fixture.customization_option.id)
        .bind(&fixture.customization_group.name)
        .bind(&fixture.customization_option.name)
        .bind(5.0)
        .execute(&fixture.pool)
        .await
        .expect("Failed to create customization");

        // Verify snapshot
        let group_name: String =
            sqlx::query_scalar("SELECT group_name FROM order_item_customizations WHERE id = $1")
                .bind(cust_id)
                .fetch_one(&fixture.pool)
                .await
                .unwrap();
        assert_eq!(group_name, fixture.customization_group.name);

        fixture.cleanup().await;
    }

    #[tokio::test]
    async fn test_order_item_preserves_data_after_product_deletion() {
        let fixture = TestFixture::new().await;

        let order_id = create_test_order(
            &fixture.pool,
            fixture.user.id,
            fixture.address.id,
            "delivered",
            100.0,
        )
        .await
        .expect("Failed to create order");

        // Create order item
        let item_id = Uuid::new_v4();
        sqlx::query(
            r#"INSERT INTO order_items
               (id, order_id, product_id, product_name, quantity, unit_price, total_price)
               VALUES ($1, $2, $3, $4, $5, $6, $7)"#,
        )
        .bind(item_id)
        .bind(order_id)
        .bind(fixture.product.id)
        .bind("Original Product Name")
        .bind(1)
        .bind(50.0)
        .bind(50.0)
        .execute(&fixture.pool)
        .await
        .expect("Failed to create order item");

        // Delete the product
        sqlx::query("DELETE FROM products WHERE id = $1")
            .bind(fixture.product.id)
            .execute(&fixture.pool)
            .await
            .expect("Failed to delete product");

        // Verify order item still exists with snapshot data
        let product_name: String =
            sqlx::query_scalar("SELECT product_name FROM order_items WHERE id = $1")
                .bind(item_id)
                .fetch_one(&fixture.pool)
                .await
                .unwrap();
        assert_eq!(product_name, "Original Product Name");

        // product_id should be NULL now
        let product_id: Option<Uuid> =
            sqlx::query_scalar("SELECT product_id FROM order_items WHERE id = $1")
                .bind(item_id)
                .fetch_one(&fixture.pool)
                .await
                .unwrap();
        assert!(product_id.is_none());

        fixture.cleanup().await;
    }
}

// ============================================================================
// Edge Cases and Constraints Tests
// ============================================================================

mod edge_case_tests {
    use super::*;

    #[tokio::test]
    async fn test_order_amount_precision() {
        let fixture = TestFixture::new().await;

        // Test with precise decimal amounts
        let order_id = create_test_order(
            &fixture.pool,
            fixture.user.id,
            fixture.address.id,
            "pending",
            123.45,
        )
        .await
        .expect("Failed to create order");

        let total: f64 = sqlx::query_scalar("SELECT total_amount FROM orders WHERE id = $1")
            .bind(order_id)
            .fetch_one(&fixture.pool)
            .await
            .unwrap();

        assert!((total - 123.45).abs() < 0.001);

        fixture.cleanup().await;
    }

    #[tokio::test]
    async fn test_order_with_zero_discount() {
        let fixture = TestFixture::new().await;

        let order_id = create_test_order(
            &fixture.pool,
            fixture.user.id,
            fixture.address.id,
            "pending",
            100.0,
        )
        .await
        .expect("Failed to create order");

        let discount: f64 = sqlx::query_scalar("SELECT discount FROM orders WHERE id = $1")
            .bind(order_id)
            .fetch_one(&fixture.pool)
            .await
            .unwrap();

        assert_eq!(discount, 0.0);

        fixture.cleanup().await;
    }

    #[tokio::test]
    async fn test_order_with_notes() {
        let fixture = TestFixture::new().await;

        let order_id = Uuid::new_v4();
        let order_number = format!(
            "ORD-TEST-{}",
            Uuid::new_v4().to_string()[..8].to_uppercase()
        );

        sqlx::query(
            r#"INSERT INTO orders (id, user_id, address_id, order_number, status,
                                   subtotal, total_amount, notes)
               VALUES ($1, $2, $3, $4, 'pending', $5, $6, $7)"#,
        )
        .bind(order_id)
        .bind(fixture.user.id)
        .bind(fixture.address.id)
        .bind(&order_number)
        .bind(100.0)
        .bind(100.0)
        .bind("Extra hot, no sugar")
        .execute(&fixture.pool)
        .await
        .expect("Failed to create order");

        let notes: Option<String> = sqlx::query_scalar("SELECT notes FROM orders WHERE id = $1")
            .bind(order_id)
            .fetch_one(&fixture.pool)
            .await
            .unwrap();

        assert_eq!(notes, Some("Extra hot, no sugar".to_string()));

        fixture.cleanup().await;
    }

    #[tokio::test]
    async fn test_multiple_orders_same_user() {
        let fixture = TestFixture::new().await;

        // Create multiple orders
        for i in 0..5 {
            create_test_order(
                &fixture.pool,
                fixture.user.id,
                fixture.address.id,
                "pending",
                100.0 + i as f64 * 10.0,
            )
            .await
            .expect("Failed to create order");
        }

        let count = count_user_orders(&fixture.pool, fixture.user.id).await;
        assert_eq!(count, 5);

        fixture.cleanup().await;
    }

    #[tokio::test]
    async fn test_order_with_multiple_addresses() {
        let fixture = TestFixture::new().await;

        // Create second address
        let address2 = TestAddress {
            id: Uuid::new_v4(),
            user_id: fixture.user.id,
            label: "Work".to_string(),
            recipient_name: "Work Recipient".to_string(),
            ..TestAddress::new(fixture.user.id)
        };
        address2
            .insert(&fixture.pool)
            .await
            .expect("Failed to insert address 2");

        // Create orders with different addresses
        let order1_id = create_test_order(
            &fixture.pool,
            fixture.user.id,
            fixture.address.id,
            "pending",
            100.0,
        )
        .await
        .expect("Failed to create order 1");

        let order2_id = create_test_order(
            &fixture.pool,
            fixture.user.id,
            address2.id,
            "pending",
            150.0,
        )
        .await
        .expect("Failed to create order 2");

        // Verify different addresses
        let addr1: Uuid = sqlx::query_scalar("SELECT address_id FROM orders WHERE id = $1")
            .bind(order1_id)
            .fetch_one(&fixture.pool)
            .await
            .unwrap();
        let addr2: Uuid = sqlx::query_scalar("SELECT address_id FROM orders WHERE id = $1")
            .bind(order2_id)
            .fetch_one(&fixture.pool)
            .await
            .unwrap();

        assert_ne!(addr1, addr2);

        fixture.cleanup().await;
    }

    #[tokio::test]
    async fn test_payment_amount_matches_order() {
        let fixture = TestFixture::new().await;

        let order_amount = 354.50;
        let order_id = create_test_order(
            &fixture.pool,
            fixture.user.id,
            fixture.address.id,
            "pending",
            order_amount,
        )
        .await
        .expect("Failed to create order");

        create_test_payment(&fixture.pool, order_id, "pending", order_amount)
            .await
            .expect("Failed to create payment");

        // Verify amounts match
        let order_total: f64 = sqlx::query_scalar("SELECT total_amount FROM orders WHERE id = $1")
            .bind(order_id)
            .fetch_one(&fixture.pool)
            .await
            .unwrap();

        let payment_amount: f64 =
            sqlx::query_scalar("SELECT amount FROM payments WHERE order_id = $1")
                .bind(order_id)
                .fetch_one(&fixture.pool)
                .await
                .unwrap();

        assert!((order_total - payment_amount).abs() < 0.01);

        fixture.cleanup().await;
    }
}

// ============================================================================
// Query and Filter Tests
// ============================================================================

mod query_tests {
    use super::*;

    #[tokio::test]
    async fn test_filter_orders_by_status() {
        let fixture = TestFixture::new().await;

        // Create orders with different statuses
        create_test_order(
            &fixture.pool,
            fixture.user.id,
            fixture.address.id,
            "pending",
            100.0,
        )
        .await
        .unwrap();
        create_test_order(
            &fixture.pool,
            fixture.user.id,
            fixture.address.id,
            "confirmed",
            150.0,
        )
        .await
        .unwrap();
        create_test_order(
            &fixture.pool,
            fixture.user.id,
            fixture.address.id,
            "confirmed",
            200.0,
        )
        .await
        .unwrap();
        create_test_order(
            &fixture.pool,
            fixture.user.id,
            fixture.address.id,
            "delivered",
            250.0,
        )
        .await
        .unwrap();

        // Filter by confirmed
        let confirmed_count: i64 = sqlx::query_scalar(
            "SELECT COUNT(*) FROM orders WHERE user_id = $1 AND status = 'confirmed'",
        )
        .bind(fixture.user.id)
        .fetch_one(&fixture.pool)
        .await
        .unwrap();
        assert_eq!(confirmed_count, 2);

        // Filter by pending
        let pending_count: i64 = sqlx::query_scalar(
            "SELECT COUNT(*) FROM orders WHERE user_id = $1 AND status = 'pending'",
        )
        .bind(fixture.user.id)
        .fetch_one(&fixture.pool)
        .await
        .unwrap();
        assert_eq!(pending_count, 1);

        fixture.cleanup().await;
    }

    #[tokio::test]
    async fn test_orders_ordered_by_created_at() {
        let fixture = TestFixture::new().await;

        // Create orders
        let order1 = create_test_order(
            &fixture.pool,
            fixture.user.id,
            fixture.address.id,
            "pending",
            100.0,
        )
        .await
        .unwrap();
        tokio::time::sleep(tokio::time::Duration::from_millis(10)).await;
        let order2 = create_test_order(
            &fixture.pool,
            fixture.user.id,
            fixture.address.id,
            "pending",
            150.0,
        )
        .await
        .unwrap();

        // Query with order by created_at DESC
        let orders: Vec<Uuid> =
            sqlx::query_scalar("SELECT id FROM orders WHERE user_id = $1 ORDER BY created_at DESC")
                .bind(fixture.user.id)
                .fetch_all(&fixture.pool)
                .await
                .unwrap();

        assert_eq!(orders.len(), 2);
        assert_eq!(orders[0], order2); // Most recent first
        assert_eq!(orders[1], order1);

        fixture.cleanup().await;
    }

    #[tokio::test]
    async fn test_payment_history_aggregation() {
        let fixture = TestFixture::new().await;

        // Create orders and payments with different statuses
        let order1 = create_test_order(
            &fixture.pool,
            fixture.user.id,
            fixture.address.id,
            "confirmed",
            100.0,
        )
        .await
        .unwrap();
        let order2 = create_test_order(
            &fixture.pool,
            fixture.user.id,
            fixture.address.id,
            "confirmed",
            200.0,
        )
        .await
        .unwrap();
        let order3 = create_test_order(
            &fixture.pool,
            fixture.user.id,
            fixture.address.id,
            "pending",
            150.0,
        )
        .await
        .unwrap();

        create_test_payment(&fixture.pool, order1, "captured", 100.0)
            .await
            .unwrap();
        create_test_payment(&fixture.pool, order2, "captured", 200.0)
            .await
            .unwrap();
        create_test_payment(&fixture.pool, order3, "failed", 150.0)
            .await
            .unwrap();

        // Aggregate captured payments
        let total_captured: f64 = sqlx::query_scalar(
            r#"SELECT COALESCE(SUM(amount), 0)
               FROM payments p
               JOIN orders o ON p.order_id = o.id
               WHERE o.user_id = $1 AND p.status = 'captured'"#,
        )
        .bind(fixture.user.id)
        .fetch_one(&fixture.pool)
        .await
        .unwrap();

        assert!((total_captured - 300.0).abs() < 0.01);

        fixture.cleanup().await;
    }
}

// ============================================================================
// Constraint Violation Tests
// ============================================================================

mod constraint_tests {
    use super::*;

    #[tokio::test]
    async fn test_order_requires_valid_user() {
        let fixture = TestFixture::new().await;

        let invalid_user_id = Uuid::new_v4();
        let order_id = Uuid::new_v4();
        let order_number = format!(
            "ORD-TEST-{}",
            Uuid::new_v4().to_string()[..8].to_uppercase()
        );

        let result = sqlx::query(
            r#"INSERT INTO orders (id, user_id, address_id, order_number, status, subtotal, total_amount)
               VALUES ($1, $2, $3, $4, 'pending', 100, 100)"#
        )
        .bind(order_id)
        .bind(invalid_user_id)
        .bind(fixture.address.id)
        .bind(&order_number)
        .execute(&fixture.pool)
        .await;

        assert!(result.is_err());

        fixture.cleanup().await;
    }

    #[tokio::test]
    async fn test_order_requires_valid_address() {
        let fixture = TestFixture::new().await;

        let invalid_address_id = Uuid::new_v4();
        let order_id = Uuid::new_v4();
        let order_number = format!(
            "ORD-TEST-{}",
            Uuid::new_v4().to_string()[..8].to_uppercase()
        );

        let result = sqlx::query(
            r#"INSERT INTO orders (id, user_id, address_id, order_number, status, subtotal, total_amount)
               VALUES ($1, $2, $3, $4, 'pending', 100, 100)"#
        )
        .bind(order_id)
        .bind(fixture.user.id)
        .bind(invalid_address_id)
        .bind(&order_number)
        .execute(&fixture.pool)
        .await;

        assert!(result.is_err());

        fixture.cleanup().await;
    }

    #[tokio::test]
    async fn test_payment_requires_valid_order() {
        let fixture = TestFixture::new().await;

        let invalid_order_id = Uuid::new_v4();
        let payment_id = Uuid::new_v4();
        let razorpay_order_id = format!("order_test_{}", &Uuid::new_v4().to_string()[..12]);

        let result = sqlx::query(
            r#"INSERT INTO payments (id, order_id, razorpay_order_id, amount, status)
               VALUES ($1, $2, $3, 100, 'pending')"#,
        )
        .bind(payment_id)
        .bind(invalid_order_id)
        .bind(&razorpay_order_id)
        .execute(&fixture.pool)
        .await;

        assert!(result.is_err());

        fixture.cleanup().await;
    }

    #[tokio::test]
    async fn test_order_number_unique() {
        let fixture = TestFixture::new().await;

        let order_number = "ORD-TEST-UNIQUE-001";

        // Create first order
        let order1_id = Uuid::new_v4();
        sqlx::query(
            r#"INSERT INTO orders (id, user_id, address_id, order_number, status, subtotal, total_amount)
               VALUES ($1, $2, $3, $4, 'pending', 100, 100)"#
        )
        .bind(order1_id)
        .bind(fixture.user.id)
        .bind(fixture.address.id)
        .bind(order_number)
        .execute(&fixture.pool)
        .await
        .expect("Failed to create first order");

        // Try to create second order with same number
        let order2_id = Uuid::new_v4();
        let result = sqlx::query(
            r#"INSERT INTO orders (id, user_id, address_id, order_number, status, subtotal, total_amount)
               VALUES ($1, $2, $3, $4, 'pending', 100, 100)"#
        )
        .bind(order2_id)
        .bind(fixture.user.id)
        .bind(fixture.address.id)
        .bind(order_number)
        .execute(&fixture.pool)
        .await;

        assert!(result.is_err());

        fixture.cleanup().await;
    }

    #[tokio::test]
    async fn test_razorpay_order_id_unique() {
        let fixture = TestFixture::new().await;

        let order1 = create_test_order(
            &fixture.pool,
            fixture.user.id,
            fixture.address.id,
            "pending",
            100.0,
        )
        .await
        .unwrap();
        let order2 = create_test_order(
            &fixture.pool,
            fixture.user.id,
            fixture.address.id,
            "pending",
            150.0,
        )
        .await
        .unwrap();

        let razorpay_order_id = "order_duplicate_test";

        // Create first payment
        sqlx::query(
            "INSERT INTO payments (id, order_id, razorpay_order_id, amount, status) VALUES ($1, $2, $3, 100, 'pending')"
        )
        .bind(Uuid::new_v4())
        .bind(order1)
        .bind(razorpay_order_id)
        .execute(&fixture.pool)
        .await
        .expect("Failed to create first payment");

        // Try to create second payment with same razorpay_order_id
        let result = sqlx::query(
            "INSERT INTO payments (id, order_id, razorpay_order_id, amount, status) VALUES ($1, $2, $3, 150, 'pending')"
        )
        .bind(Uuid::new_v4())
        .bind(order2)
        .bind(razorpay_order_id)
        .execute(&fixture.pool)
        .await;

        assert!(result.is_err());

        fixture.cleanup().await;
    }

    #[tokio::test]
    async fn test_order_item_quantity_positive() {
        let fixture = TestFixture::new().await;

        let order_id = create_test_order(
            &fixture.pool,
            fixture.user.id,
            fixture.address.id,
            "pending",
            100.0,
        )
        .await
        .unwrap();

        // Try to create item with zero quantity
        let result = sqlx::query(
            r#"INSERT INTO order_items (id, order_id, product_id, product_name, quantity, unit_price, total_price)
               VALUES ($1, $2, $3, 'Test', 0, 50, 0)"#
        )
        .bind(Uuid::new_v4())
        .bind(order_id)
        .bind(fixture.product.id)
        .execute(&fixture.pool)
        .await;

        assert!(result.is_err());

        // Try to create item with negative quantity
        let result = sqlx::query(
            r#"INSERT INTO order_items (id, order_id, product_id, product_name, quantity, unit_price, total_price)
               VALUES ($1, $2, $3, 'Test', -1, 50, -50)"#
        )
        .bind(Uuid::new_v4())
        .bind(order_id)
        .bind(fixture.product.id)
        .execute(&fixture.pool)
        .await;

        assert!(result.is_err());

        fixture.cleanup().await;
    }

    #[tokio::test]
    async fn test_order_status_constraint() {
        let fixture = TestFixture::new().await;

        let order_id = Uuid::new_v4();
        let order_number = format!(
            "ORD-TEST-{}",
            Uuid::new_v4().to_string()[..8].to_uppercase()
        );

        // Try to create order with invalid status
        let result = sqlx::query(
            r#"INSERT INTO orders (id, user_id, address_id, order_number, status, subtotal, total_amount)
               VALUES ($1, $2, $3, $4, 'invalid_status', 100, 100)"#
        )
        .bind(order_id)
        .bind(fixture.user.id)
        .bind(fixture.address.id)
        .bind(&order_number)
        .execute(&fixture.pool)
        .await;

        assert!(result.is_err());

        fixture.cleanup().await;
    }

    #[tokio::test]
    async fn test_payment_status_constraint() {
        let fixture = TestFixture::new().await;

        let order_id = create_test_order(
            &fixture.pool,
            fixture.user.id,
            fixture.address.id,
            "pending",
            100.0,
        )
        .await
        .unwrap();

        // Try to create payment with invalid status
        let result = sqlx::query(
            r#"INSERT INTO payments (id, order_id, razorpay_order_id, amount, status)
               VALUES ($1, $2, 'order_test', 100, 'invalid_status')"#,
        )
        .bind(Uuid::new_v4())
        .bind(order_id)
        .execute(&fixture.pool)
        .await;

        assert!(result.is_err());

        fixture.cleanup().await;
    }
}

// ============================================================================
// Cascade Delete Tests
// ============================================================================

mod cascade_tests {
    use super::*;

    #[tokio::test]
    async fn test_order_items_deleted_with_order() {
        let fixture = TestFixture::new().await;

        let order_id = create_test_order(
            &fixture.pool,
            fixture.user.id,
            fixture.address.id,
            "pending",
            100.0,
        )
        .await
        .unwrap();

        // Create order item
        let item_id = Uuid::new_v4();
        sqlx::query(
            r#"INSERT INTO order_items (id, order_id, product_id, product_name, quantity, unit_price, total_price)
               VALUES ($1, $2, $3, 'Test', 1, 100, 100)"#
        )
        .bind(item_id)
        .bind(order_id)
        .bind(fixture.product.id)
        .execute(&fixture.pool)
        .await
        .expect("Failed to create order item");

        // Delete order
        sqlx::query("DELETE FROM orders WHERE id = $1")
            .bind(order_id)
            .execute(&fixture.pool)
            .await
            .expect("Failed to delete order");

        // Verify item is also deleted
        let count: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM order_items WHERE id = $1")
            .bind(item_id)
            .fetch_one(&fixture.pool)
            .await
            .unwrap();
        assert_eq!(count, 0);

        fixture.cleanup().await;
    }

    #[tokio::test]
    async fn test_order_item_customizations_deleted_with_item() {
        let fixture = TestFixture::new().await;

        let order_id = create_test_order(
            &fixture.pool,
            fixture.user.id,
            fixture.address.id,
            "pending",
            100.0,
        )
        .await
        .unwrap();

        // Create order item
        let item_id = Uuid::new_v4();
        sqlx::query(
            r#"INSERT INTO order_items (id, order_id, product_id, product_name, quantity, unit_price, total_price)
               VALUES ($1, $2, $3, 'Test', 1, 100, 100)"#
        )
        .bind(item_id)
        .bind(order_id)
        .bind(fixture.product.id)
        .execute(&fixture.pool)
        .await
        .expect("Failed to create order item");

        // Create customization
        let cust_id = Uuid::new_v4();
        sqlx::query(
            r#"INSERT INTO order_item_customizations
               (id, order_item_id, group_id, option_id, group_name, option_name, price_modifier)
               VALUES ($1, $2, $3, $4, 'Sugar', 'Extra', 5)"#,
        )
        .bind(cust_id)
        .bind(item_id)
        .bind(fixture.customization_group.id)
        .bind(fixture.customization_option.id)
        .execute(&fixture.pool)
        .await
        .expect("Failed to create customization");

        // Delete order (cascades to items and customizations)
        sqlx::query("DELETE FROM orders WHERE id = $1")
            .bind(order_id)
            .execute(&fixture.pool)
            .await
            .expect("Failed to delete order");

        // Verify customization is also deleted
        let count: i64 =
            sqlx::query_scalar("SELECT COUNT(*) FROM order_item_customizations WHERE id = $1")
                .bind(cust_id)
                .fetch_one(&fixture.pool)
                .await
                .unwrap();
        assert_eq!(count, 0);

        fixture.cleanup().await;
    }

    #[tokio::test]
    async fn test_order_status_history_deleted_with_order() {
        let fixture = TestFixture::new().await;

        let order_id = create_test_order(
            &fixture.pool,
            fixture.user.id,
            fixture.address.id,
            "pending",
            100.0,
        )
        .await
        .unwrap();

        // Create status history
        let history_id = Uuid::new_v4();
        sqlx::query(
            "INSERT INTO order_status_history (id, order_id, to_status) VALUES ($1, $2, 'pending')",
        )
        .bind(history_id)
        .bind(order_id)
        .execute(&fixture.pool)
        .await
        .expect("Failed to create history");

        // Delete order
        sqlx::query("DELETE FROM orders WHERE id = $1")
            .bind(order_id)
            .execute(&fixture.pool)
            .await
            .expect("Failed to delete order");

        // Verify history is also deleted
        let count: i64 =
            sqlx::query_scalar("SELECT COUNT(*) FROM order_status_history WHERE id = $1")
                .bind(history_id)
                .fetch_one(&fixture.pool)
                .await
                .unwrap();
        assert_eq!(count, 0);

        fixture.cleanup().await;
    }
}
