use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;
use validator::Validate;

// ============================================================================
// Order Status Enum
// ============================================================================

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, sqlx::Type)]
#[sqlx(type_name = "TEXT", rename_all = "snake_case")]
#[serde(rename_all = "snake_case")]
pub enum OrderStatus {
    Pending,
    Confirmed,
    Preparing,
    OutForDelivery,
    Delivered,
    Cancelled,
}

impl OrderStatus {
    pub fn as_str(&self) -> &'static str {
        match self {
            OrderStatus::Pending => "pending",
            OrderStatus::Confirmed => "confirmed",
            OrderStatus::Preparing => "preparing",
            OrderStatus::OutForDelivery => "out_for_delivery",
            OrderStatus::Delivered => "delivered",
            OrderStatus::Cancelled => "cancelled",
        }
    }

    /// Check if transition from current status to new status is valid
    pub fn can_transition_to(&self, new_status: OrderStatus) -> bool {
        match (self, new_status) {
            // From Pending
            (OrderStatus::Pending, OrderStatus::Confirmed) => true,
            (OrderStatus::Pending, OrderStatus::Cancelled) => true,

            // From Confirmed
            (OrderStatus::Confirmed, OrderStatus::Preparing) => true,
            (OrderStatus::Confirmed, OrderStatus::Cancelled) => true,

            // From Preparing
            (OrderStatus::Preparing, OrderStatus::OutForDelivery) => true,
            (OrderStatus::Preparing, OrderStatus::Cancelled) => true,

            // From OutForDelivery
            (OrderStatus::OutForDelivery, OrderStatus::Delivered) => true,

            // No other transitions allowed
            _ => false,
        }
    }
}

impl std::str::FromStr for OrderStatus {
    type Err = ();

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s {
            "pending" => Ok(OrderStatus::Pending),
            "confirmed" => Ok(OrderStatus::Confirmed),
            "preparing" => Ok(OrderStatus::Preparing),
            "out_for_delivery" => Ok(OrderStatus::OutForDelivery),
            "delivered" => Ok(OrderStatus::Delivered),
            "cancelled" => Ok(OrderStatus::Cancelled),
            _ => Err(()),
        }
    }
}

// ============================================================================
// Payment Status Enum
// ============================================================================

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, sqlx::Type)]
#[sqlx(type_name = "TEXT", rename_all = "snake_case")]
#[serde(rename_all = "snake_case")]
pub enum PaymentStatus {
    Pending,
    Authorized,
    Captured,
    Failed,
    Refunded,
}

impl PaymentStatus {
    pub fn as_str(&self) -> &'static str {
        match self {
            PaymentStatus::Pending => "pending",
            PaymentStatus::Authorized => "authorized",
            PaymentStatus::Captured => "captured",
            PaymentStatus::Failed => "failed",
            PaymentStatus::Refunded => "refunded",
        }
    }
}

impl std::str::FromStr for PaymentStatus {
    type Err = ();

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s {
            "pending" => Ok(PaymentStatus::Pending),
            "authorized" => Ok(PaymentStatus::Authorized),
            "captured" => Ok(PaymentStatus::Captured),
            "failed" => Ok(PaymentStatus::Failed),
            "refunded" => Ok(PaymentStatus::Refunded),
            _ => Err(()),
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum PaymentMethod {
    Upi,
    Card,
    Netbanking,
    Wallet,
    Cod,
}

impl PaymentMethod {
    pub fn as_str(&self) -> &'static str {
        match self {
            PaymentMethod::Upi => "upi",
            PaymentMethod::Card => "card",
            PaymentMethod::Netbanking => "netbanking",
            PaymentMethod::Wallet => "wallet",
            PaymentMethod::Cod => "cod",
        }
    }
}

impl std::str::FromStr for PaymentMethod {
    type Err = ();

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s {
            "upi" => Ok(PaymentMethod::Upi),
            "card" => Ok(PaymentMethod::Card),
            "netbanking" => Ok(PaymentMethod::Netbanking),
            "wallet" => Ok(PaymentMethod::Wallet),
            "cod" => Ok(PaymentMethod::Cod),
            _ => Err(()),
        }
    }
}

// ============================================================================
// Database Models
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Order {
    pub id: Uuid,
    pub user_id: Uuid,
    pub address_id: Uuid,
    pub order_number: String,
    pub status: String,
    pub subtotal: f64,
    pub tax_cgst: f64,
    pub tax_sgst: f64,
    pub delivery_charge: f64,
    pub discount: f64,
    pub total_amount: f64,
    pub notes: Option<String>,
    pub delivery_partner_name: Option<String>,
    pub delivery_partner_phone: Option<String>,
    pub confirmed_at: Option<DateTime<Utc>>,
    pub preparing_at: Option<DateTime<Utc>>,
    pub out_for_delivery_at: Option<DateTime<Utc>>,
    pub delivered_at: Option<DateTime<Utc>>,
    pub cancelled_at: Option<DateTime<Utc>>,
    pub cancellation_reason: Option<String>,
    pub created_at: Option<DateTime<Utc>>,
    pub updated_at: Option<DateTime<Utc>>,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct OrderItem {
    pub id: Uuid,
    pub order_id: Uuid,
    pub product_id: Option<Uuid>,
    pub product_name: String,
    pub product_image_urls: Vec<String>,
    pub quantity: i32,
    pub unit_price: f64,
    pub customization_price: f64,
    pub total_price: f64,
    pub created_at: Option<DateTime<Utc>>,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct OrderItemCustomization {
    pub id: Uuid,
    pub order_item_id: Uuid,
    pub group_id: Option<Uuid>,
    pub option_id: Option<Uuid>,
    pub group_name: String,
    pub option_name: String,
    pub price_modifier: f64,
    pub created_at: Option<DateTime<Utc>>,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Payment {
    pub id: Uuid,
    pub order_id: Uuid,
    pub razorpay_order_id: String,
    pub razorpay_payment_id: Option<String>,
    pub razorpay_signature: Option<String>,
    pub amount: f64,
    pub currency: String,
    pub status: String,
    pub method: Option<String>,
    pub error_code: Option<String>,
    pub error_description: Option<String>,
    pub refund_id: Option<String>,
    pub refund_status: Option<String>,
    pub refunded_at: Option<DateTime<Utc>>,
    pub refund_amount: Option<f64>,
    pub webhook_verified: bool,
    pub webhook_received_at: Option<DateTime<Utc>>,
    pub razorpay_webhook_payload: Option<serde_json::Value>,
    pub created_at: Option<DateTime<Utc>>,
    pub updated_at: Option<DateTime<Utc>>,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct OrderStatusHistory {
    pub id: Uuid,
    pub order_id: Uuid,
    pub from_status: Option<String>,
    pub to_status: String,
    pub changed_by: Option<Uuid>,
    pub notes: Option<String>,
    pub created_at: Option<DateTime<Utc>>,
}

// ============================================================================
// Request DTOs
// ============================================================================

/// Request to create a new order from cart
#[derive(Debug, Deserialize, Validate)]
pub struct CreateOrderRequest {
    pub address_id: Uuid,
    pub notes: Option<String>,
}

/// Request to initiate payment (creates Razorpay order)
#[derive(Debug, Deserialize)]
pub struct InitiatePaymentRequest {
    pub order_id: Uuid,
}

/// Request to verify payment (from frontend after Razorpay SDK callback)
#[derive(Debug, Deserialize)]
pub struct VerifyPaymentRequest {
    pub razorpay_order_id: String,
    pub razorpay_payment_id: String,
    pub razorpay_signature: String,
}

/// Webhook payload from Razorpay
#[derive(Debug, Deserialize)]
pub struct RazorpayWebhookPayload {
    pub event: String,
    pub payload: RazorpayWebhookPayloadInner,
}

#[derive(Debug, Deserialize)]
pub struct RazorpayWebhookPayloadInner {
    pub payment: Option<RazorpayWebhookPayment>,
    pub order: Option<RazorpayWebhookOrder>,
    pub refund: Option<RazorpayWebhookRefund>,
}

#[derive(Debug, Deserialize)]
pub struct RazorpayWebhookPayment {
    pub entity: RazorpayPaymentEntity,
}

#[derive(Debug, Deserialize)]
pub struct RazorpayPaymentEntity {
    pub id: String,
    pub order_id: String,
    pub amount: i64, // Amount in paise
    pub currency: String,
    pub status: String,
    pub method: Option<String>,
    pub error_code: Option<String>,
    pub error_description: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct RazorpayWebhookOrder {
    pub entity: RazorpayOrderEntity,
}

#[derive(Debug, Deserialize)]
pub struct RazorpayOrderEntity {
    pub id: String,
    pub amount: i64,
    pub status: String,
}

#[derive(Debug, Deserialize)]
pub struct RazorpayWebhookRefund {
    pub entity: RazorpayRefundEntity,
}

#[derive(Debug, Deserialize)]
pub struct RazorpayRefundEntity {
    pub id: String,
    pub payment_id: String,
    pub amount: i64,
    pub currency: String,
    pub status: String,
    pub order_id: Option<String>,
}

/// Request to cancel order
#[derive(Debug, Deserialize, Validate)]
pub struct CancelOrderRequest {
    #[validate(length(min = 1, max = 500, message = "Reason must be 1-500 characters"))]
    pub reason: String,
}

/// Request to update order status (admin)
#[derive(Debug, Deserialize)]
pub struct UpdateOrderStatusRequest {
    pub status: String,
    pub delivery_partner_name: Option<String>,
    pub delivery_partner_phone: Option<String>,
    pub notes: Option<String>,
}

// ============================================================================
// Response DTOs
// ============================================================================

/// Order summary for list view
#[derive(Debug, Serialize)]
pub struct OrderSummaryDto {
    pub id: Uuid,
    pub order_number: String,
    pub status: String,
    pub total_amount: f64,
    pub item_count: i32,
    pub created_at: Option<DateTime<Utc>>,
}

/// Full order details
#[derive(Debug, Serialize)]
pub struct OrderDetailDto {
    pub id: Uuid,
    pub order_number: String,
    pub status: String,
    pub subtotal: f64,
    pub tax_cgst: f64,
    pub tax_sgst: f64,
    pub delivery_charge: f64,
    pub discount: f64,
    pub total_amount: f64,
    pub notes: Option<String>,
    pub items: Vec<OrderItemDto>,
    pub address: AddressSnapshotDto,
    pub payment: Option<PaymentDto>,
    pub timeline: Vec<OrderTimelineEventDto>,
    pub delivery_partner_name: Option<String>,
    pub delivery_partner_phone: Option<String>,
    pub created_at: Option<DateTime<Utc>>,
}

#[derive(Debug, Serialize)]
pub struct OrderItemDto {
    pub id: Uuid,
    pub product_id: Option<Uuid>,
    pub product_name: String,
    pub product_image_urls: Vec<String>,
    pub quantity: i32,
    pub unit_price: f64,
    pub customization_price: f64,
    pub total_price: f64,
    pub customizations: Vec<OrderItemCustomizationDto>,
}

#[derive(Debug, Serialize)]
pub struct OrderItemCustomizationDto {
    pub group_name: String,
    pub option_name: String,
    pub price_modifier: f64,
}

#[derive(Debug, Serialize)]
pub struct AddressSnapshotDto {
    pub recipient_name: String,
    pub phone_number: String,
    pub street_address: String,
    pub city: String,
    pub state: String,
    pub postal_code: String,
    pub label: String,
}

#[derive(Debug, Serialize)]
pub struct PaymentDto {
    pub id: Uuid,
    pub razorpay_order_id: String,
    pub razorpay_payment_id: Option<String>,
    pub amount: f64,
    pub currency: String,
    pub status: String,
    pub method: Option<String>,
    pub error_code: Option<String>,
    pub error_description: Option<String>,
    pub created_at: Option<DateTime<Utc>>,
}

#[derive(Debug, Serialize)]
pub struct OrderTimelineEventDto {
    pub status: String,
    pub timestamp: Option<DateTime<Utc>>,
    pub is_completed: bool,
    pub is_current: bool,
}

/// Response after initiating payment
#[derive(Debug, Serialize)]
pub struct InitiatePaymentResponse {
    pub razorpay_order_id: String,
    pub razorpay_key_id: String,
    pub amount: i64, // Amount in paise for Razorpay SDK
    pub currency: String,
    pub order_id: Uuid, // Our internal order ID
    pub order_number: String,
    pub prefill: PaymentPrefillDto,
}

#[derive(Debug, Serialize)]
pub struct PaymentPrefillDto {
    pub name: String,
    pub email: String,
    pub contact: String,
}

/// Response after successful payment verification
#[derive(Debug, Serialize)]
pub struct PaymentVerificationResponse {
    pub success: bool,
    pub order_id: Uuid,
    pub order_number: String,
    pub payment_id: String,
    pub message: String,
}

// ============================================================================
// Payment History DTOs
// ============================================================================

#[derive(Debug, Serialize)]
pub struct PaymentHistoryDto {
    pub id: Uuid,
    pub order_id: Uuid,
    pub order_number: String,
    pub razorpay_order_id: String,
    pub razorpay_payment_id: Option<String>,
    pub amount: f64,
    pub currency: String,
    pub status: String,
    pub method: Option<String>,
    pub error_code: Option<String>,
    pub error_description: Option<String>,
    pub created_at: Option<DateTime<Utc>>,
}

#[derive(Debug, Serialize)]
pub struct PaymentHistoryListDto {
    pub payments: Vec<PaymentHistoryDto>,
    pub total_count: i64,
    pub total_successful: f64,
    pub total_failed_count: i64,
    pub total_refunded: f64,
}

// ============================================================================
// Query Parameters
// ============================================================================

#[derive(Debug, Deserialize, Default)]
pub struct OrderListQuery {
    pub status: Option<String>,
    pub page: Option<i64>,
    pub limit: Option<i64>,
}

#[derive(Debug, Deserialize, Default)]
pub struct PaymentHistoryQuery {
    pub status: Option<String>,
    pub page: Option<i64>,
    pub limit: Option<i64>,
}

// ============================================================================
// Unit Tests
// ============================================================================

#[cfg(test)]
mod tests {
    use super::*;
    use std::str::FromStr;

    // ========================================================================
    // OrderStatus Tests
    // ========================================================================

    mod order_status_tests {
        use super::*;

        #[test]
        fn test_order_status_as_str() {
            assert_eq!(OrderStatus::Pending.as_str(), "pending");
            assert_eq!(OrderStatus::Confirmed.as_str(), "confirmed");
            assert_eq!(OrderStatus::Preparing.as_str(), "preparing");
            assert_eq!(OrderStatus::OutForDelivery.as_str(), "out_for_delivery");
            assert_eq!(OrderStatus::Delivered.as_str(), "delivered");
            assert_eq!(OrderStatus::Cancelled.as_str(), "cancelled");
        }

        #[test]
        fn test_order_status_from_str_valid() {
            assert_eq!(OrderStatus::from_str("pending"), Ok(OrderStatus::Pending));
            assert_eq!(
                OrderStatus::from_str("confirmed"),
                Ok(OrderStatus::Confirmed)
            );
            assert_eq!(
                OrderStatus::from_str("preparing"),
                Ok(OrderStatus::Preparing)
            );
            assert_eq!(
                OrderStatus::from_str("out_for_delivery"),
                Ok(OrderStatus::OutForDelivery)
            );
            assert_eq!(
                OrderStatus::from_str("delivered"),
                Ok(OrderStatus::Delivered)
            );
            assert_eq!(
                OrderStatus::from_str("cancelled"),
                Ok(OrderStatus::Cancelled)
            );
        }

        #[test]
        fn test_order_status_from_str_invalid() {
            assert_eq!(OrderStatus::from_str("invalid"), Err(()));
            assert_eq!(OrderStatus::from_str("PENDING"), Err(()));
            assert_eq!(OrderStatus::from_str(""), Err(()));
            assert_eq!(OrderStatus::from_str("shipped"), Err(()));
        }

        #[test]
        fn test_order_status_roundtrip() {
            let statuses = [
                OrderStatus::Pending,
                OrderStatus::Confirmed,
                OrderStatus::Preparing,
                OrderStatus::OutForDelivery,
                OrderStatus::Delivered,
                OrderStatus::Cancelled,
            ];

            for status in statuses {
                let str_repr = status.as_str();
                let parsed = OrderStatus::from_str(str_repr);
                assert_eq!(parsed, Ok(status));
            }
        }

        // Valid Transitions
        #[test]
        fn test_pending_can_transition_to_confirmed() {
            assert!(OrderStatus::Pending.can_transition_to(OrderStatus::Confirmed));
        }

        #[test]
        fn test_pending_can_transition_to_cancelled() {
            assert!(OrderStatus::Pending.can_transition_to(OrderStatus::Cancelled));
        }

        #[test]
        fn test_confirmed_can_transition_to_preparing() {
            assert!(OrderStatus::Confirmed.can_transition_to(OrderStatus::Preparing));
        }

        #[test]
        fn test_confirmed_can_transition_to_cancelled() {
            assert!(OrderStatus::Confirmed.can_transition_to(OrderStatus::Cancelled));
        }

        #[test]
        fn test_preparing_can_transition_to_out_for_delivery() {
            assert!(OrderStatus::Preparing.can_transition_to(OrderStatus::OutForDelivery));
        }

        #[test]
        fn test_preparing_can_transition_to_cancelled() {
            assert!(OrderStatus::Preparing.can_transition_to(OrderStatus::Cancelled));
        }

        #[test]
        fn test_out_for_delivery_can_transition_to_delivered() {
            assert!(OrderStatus::OutForDelivery.can_transition_to(OrderStatus::Delivered));
        }

        // Invalid Transitions
        #[test]
        fn test_pending_cannot_transition_to_preparing() {
            assert!(!OrderStatus::Pending.can_transition_to(OrderStatus::Preparing));
        }

        #[test]
        fn test_pending_cannot_transition_to_delivered() {
            assert!(!OrderStatus::Pending.can_transition_to(OrderStatus::Delivered));
        }

        #[test]
        fn test_pending_cannot_transition_to_out_for_delivery() {
            assert!(!OrderStatus::Pending.can_transition_to(OrderStatus::OutForDelivery));
        }

        #[test]
        fn test_confirmed_cannot_transition_to_delivered() {
            assert!(!OrderStatus::Confirmed.can_transition_to(OrderStatus::Delivered));
        }

        #[test]
        fn test_confirmed_cannot_transition_to_pending() {
            assert!(!OrderStatus::Confirmed.can_transition_to(OrderStatus::Pending));
        }

        #[test]
        fn test_preparing_cannot_transition_to_confirmed() {
            assert!(!OrderStatus::Preparing.can_transition_to(OrderStatus::Confirmed));
        }

        #[test]
        fn test_preparing_cannot_transition_to_delivered() {
            assert!(!OrderStatus::Preparing.can_transition_to(OrderStatus::Delivered));
        }

        #[test]
        fn test_out_for_delivery_cannot_transition_to_cancelled() {
            // Once out for delivery, cannot cancel
            assert!(!OrderStatus::OutForDelivery.can_transition_to(OrderStatus::Cancelled));
        }

        #[test]
        fn test_out_for_delivery_cannot_transition_to_preparing() {
            assert!(!OrderStatus::OutForDelivery.can_transition_to(OrderStatus::Preparing));
        }

        #[test]
        fn test_delivered_cannot_transition_to_any() {
            assert!(!OrderStatus::Delivered.can_transition_to(OrderStatus::Pending));
            assert!(!OrderStatus::Delivered.can_transition_to(OrderStatus::Confirmed));
            assert!(!OrderStatus::Delivered.can_transition_to(OrderStatus::Preparing));
            assert!(!OrderStatus::Delivered.can_transition_to(OrderStatus::OutForDelivery));
            assert!(!OrderStatus::Delivered.can_transition_to(OrderStatus::Cancelled));
        }

        #[test]
        fn test_cancelled_cannot_transition_to_any() {
            assert!(!OrderStatus::Cancelled.can_transition_to(OrderStatus::Pending));
            assert!(!OrderStatus::Cancelled.can_transition_to(OrderStatus::Confirmed));
            assert!(!OrderStatus::Cancelled.can_transition_to(OrderStatus::Preparing));
            assert!(!OrderStatus::Cancelled.can_transition_to(OrderStatus::OutForDelivery));
            assert!(!OrderStatus::Cancelled.can_transition_to(OrderStatus::Delivered));
        }

        #[test]
        fn test_status_cannot_transition_to_itself() {
            assert!(!OrderStatus::Pending.can_transition_to(OrderStatus::Pending));
            assert!(!OrderStatus::Confirmed.can_transition_to(OrderStatus::Confirmed));
            assert!(!OrderStatus::Preparing.can_transition_to(OrderStatus::Preparing));
            assert!(!OrderStatus::OutForDelivery.can_transition_to(OrderStatus::OutForDelivery));
            assert!(!OrderStatus::Delivered.can_transition_to(OrderStatus::Delivered));
            assert!(!OrderStatus::Cancelled.can_transition_to(OrderStatus::Cancelled));
        }

        #[test]
        fn test_complete_happy_path_transitions() {
            // Simulate a complete order lifecycle
            let mut status = OrderStatus::Pending;

            // Payment received
            assert!(status.can_transition_to(OrderStatus::Confirmed));
            status = OrderStatus::Confirmed;

            // Kitchen starts preparing
            assert!(status.can_transition_to(OrderStatus::Preparing));
            status = OrderStatus::Preparing;

            // Handed to delivery partner
            assert!(status.can_transition_to(OrderStatus::OutForDelivery));
            status = OrderStatus::OutForDelivery;

            // Delivered to customer
            assert!(status.can_transition_to(OrderStatus::Delivered));
            status = OrderStatus::Delivered;

            // Cannot go anywhere from delivered
            assert!(!status.can_transition_to(OrderStatus::Pending));
        }

        #[test]
        fn test_cancellation_at_different_stages() {
            // Can cancel from pending
            assert!(OrderStatus::Pending.can_transition_to(OrderStatus::Cancelled));

            // Can cancel from confirmed
            assert!(OrderStatus::Confirmed.can_transition_to(OrderStatus::Cancelled));

            // Can cancel from preparing (with refund)
            assert!(OrderStatus::Preparing.can_transition_to(OrderStatus::Cancelled));

            // Cannot cancel once out for delivery
            assert!(!OrderStatus::OutForDelivery.can_transition_to(OrderStatus::Cancelled));

            // Cannot cancel after delivery
            assert!(!OrderStatus::Delivered.can_transition_to(OrderStatus::Cancelled));
        }
    }

    // ========================================================================
    // PaymentStatus Tests
    // ========================================================================

    mod payment_status_tests {
        use super::*;

        #[test]
        fn test_payment_status_as_str() {
            assert_eq!(PaymentStatus::Pending.as_str(), "pending");
            assert_eq!(PaymentStatus::Authorized.as_str(), "authorized");
            assert_eq!(PaymentStatus::Captured.as_str(), "captured");
            assert_eq!(PaymentStatus::Failed.as_str(), "failed");
            assert_eq!(PaymentStatus::Refunded.as_str(), "refunded");
        }

        #[test]
        fn test_payment_status_from_str_valid() {
            assert_eq!(
                PaymentStatus::from_str("pending"),
                Ok(PaymentStatus::Pending)
            );
            assert_eq!(
                PaymentStatus::from_str("authorized"),
                Ok(PaymentStatus::Authorized)
            );
            assert_eq!(
                PaymentStatus::from_str("captured"),
                Ok(PaymentStatus::Captured)
            );
            assert_eq!(PaymentStatus::from_str("failed"), Ok(PaymentStatus::Failed));
            assert_eq!(
                PaymentStatus::from_str("refunded"),
                Ok(PaymentStatus::Refunded)
            );
        }

        #[test]
        fn test_payment_status_from_str_invalid() {
            assert_eq!(PaymentStatus::from_str("invalid"), Err(()));
            assert_eq!(PaymentStatus::from_str("PENDING"), Err(()));
            assert_eq!(PaymentStatus::from_str(""), Err(()));
            assert_eq!(PaymentStatus::from_str("success"), Err(()));
        }

        #[test]
        fn test_payment_status_roundtrip() {
            let statuses = [
                PaymentStatus::Pending,
                PaymentStatus::Authorized,
                PaymentStatus::Captured,
                PaymentStatus::Failed,
                PaymentStatus::Refunded,
            ];

            for status in statuses {
                let str_repr = status.as_str();
                let parsed = PaymentStatus::from_str(str_repr);
                assert_eq!(parsed, Ok(status));
            }
        }
    }

    // ========================================================================
    // PaymentMethod Tests
    // ========================================================================

    mod payment_method_tests {
        use super::*;

        #[test]
        fn test_payment_method_as_str() {
            assert_eq!(PaymentMethod::Upi.as_str(), "upi");
            assert_eq!(PaymentMethod::Card.as_str(), "card");
            assert_eq!(PaymentMethod::Netbanking.as_str(), "netbanking");
            assert_eq!(PaymentMethod::Wallet.as_str(), "wallet");
            assert_eq!(PaymentMethod::Cod.as_str(), "cod");
        }

        #[test]
        fn test_payment_method_from_str_valid() {
            assert_eq!(PaymentMethod::from_str("upi"), Ok(PaymentMethod::Upi));
            assert_eq!(PaymentMethod::from_str("card"), Ok(PaymentMethod::Card));
            assert_eq!(
                PaymentMethod::from_str("netbanking"),
                Ok(PaymentMethod::Netbanking)
            );
            assert_eq!(PaymentMethod::from_str("wallet"), Ok(PaymentMethod::Wallet));
            assert_eq!(PaymentMethod::from_str("cod"), Ok(PaymentMethod::Cod));
        }

        #[test]
        fn test_payment_method_from_str_invalid() {
            assert_eq!(PaymentMethod::from_str("invalid"), Err(()));
            assert_eq!(PaymentMethod::from_str("UPI"), Err(()));
            assert_eq!(PaymentMethod::from_str(""), Err(()));
            assert_eq!(PaymentMethod::from_str("cash"), Err(()));
            assert_eq!(PaymentMethod::from_str("credit_card"), Err(()));
        }

        #[test]
        fn test_payment_method_roundtrip() {
            let methods = [
                PaymentMethod::Upi,
                PaymentMethod::Card,
                PaymentMethod::Netbanking,
                PaymentMethod::Wallet,
                PaymentMethod::Cod,
            ];

            for method in methods {
                let str_repr = method.as_str();
                let parsed = PaymentMethod::from_str(str_repr);
                assert_eq!(parsed, Ok(method));
            }
        }
    }

    // ========================================================================
    // CreateOrderRequest Validation Tests
    // ========================================================================

    mod create_order_request_tests {
        use super::*;

        #[test]
        fn test_create_order_request_valid() {
            let request = CreateOrderRequest {
                address_id: Uuid::new_v4(),
                notes: Some("Please deliver to back door".to_string()),
            };
            assert!(request.validate().is_ok());
        }

        #[test]
        fn test_create_order_request_without_notes() {
            let request = CreateOrderRequest {
                address_id: Uuid::new_v4(),
                notes: None,
            };
            assert!(request.validate().is_ok());
        }

        #[test]
        fn test_create_order_request_with_empty_notes() {
            let request = CreateOrderRequest {
                address_id: Uuid::new_v4(),
                notes: Some("".to_string()),
            };
            assert!(request.validate().is_ok());
        }
    }

    // ========================================================================
    // CancelOrderRequest Validation Tests
    // ========================================================================

    mod cancel_order_request_tests {
        use super::*;

        #[test]
        fn test_cancel_order_request_valid() {
            let request = CancelOrderRequest {
                reason: "Changed my mind".to_string(),
            };
            assert!(request.validate().is_ok());
        }

        #[test]
        fn test_cancel_order_request_empty_reason_invalid() {
            let request = CancelOrderRequest {
                reason: "".to_string(),
            };
            assert!(request.validate().is_err());
        }

        #[test]
        fn test_cancel_order_request_long_reason_valid() {
            let request = CancelOrderRequest {
                reason: "A".repeat(500),
            };
            assert!(request.validate().is_ok());
        }

        #[test]
        fn test_cancel_order_request_too_long_reason_invalid() {
            let request = CancelOrderRequest {
                reason: "A".repeat(501),
            };
            assert!(request.validate().is_err());
        }

        #[test]
        fn test_cancel_order_request_min_length() {
            let request = CancelOrderRequest {
                reason: "X".to_string(),
            };
            assert!(request.validate().is_ok());
        }
    }

    // ========================================================================
    // Serialization Tests
    // ========================================================================

    mod serialization_tests {
        use super::*;

        #[test]
        fn test_order_status_serializes_to_snake_case() {
            let status = OrderStatus::OutForDelivery;
            let json = serde_json::to_string(&status).unwrap();
            assert_eq!(json, "\"out_for_delivery\"");
        }

        #[test]
        fn test_order_status_deserializes_from_snake_case() {
            let json = "\"out_for_delivery\"";
            let status: OrderStatus = serde_json::from_str(json).unwrap();
            assert_eq!(status, OrderStatus::OutForDelivery);
        }

        #[test]
        fn test_payment_status_serializes_correctly() {
            let status = PaymentStatus::Captured;
            let json = serde_json::to_string(&status).unwrap();
            assert_eq!(json, "\"captured\"");
        }

        #[test]
        fn test_payment_method_serializes_correctly() {
            let method = PaymentMethod::Upi;
            let json = serde_json::to_string(&method).unwrap();
            assert_eq!(json, "\"upi\"");
        }

        #[test]
        fn test_verify_payment_request_deserializes() {
            let json = r#"{
                "razorpay_order_id": "order_123",
                "razorpay_payment_id": "pay_456",
                "razorpay_signature": "sig_789"
            }"#;

            let request: VerifyPaymentRequest = serde_json::from_str(json).unwrap();
            assert_eq!(request.razorpay_order_id, "order_123");
            assert_eq!(request.razorpay_payment_id, "pay_456");
            assert_eq!(request.razorpay_signature, "sig_789");
        }

        #[test]
        fn test_order_list_query_defaults() {
            let query = OrderListQuery::default();
            assert!(query.status.is_none());
            assert!(query.page.is_none());
            assert!(query.limit.is_none());
        }

        #[test]
        fn test_payment_history_query_defaults() {
            let query = PaymentHistoryQuery::default();
            assert!(query.status.is_none());
            assert!(query.page.is_none());
            assert!(query.limit.is_none());
        }
    }

    // ========================================================================
    // Edge Case Tests
    // ========================================================================

    mod edge_case_tests {
        use super::*;

        #[test]
        fn test_order_status_equality() {
            assert_eq!(OrderStatus::Pending, OrderStatus::Pending);
            assert_ne!(OrderStatus::Pending, OrderStatus::Confirmed);
        }

        #[test]
        fn test_payment_status_equality() {
            assert_eq!(PaymentStatus::Pending, PaymentStatus::Pending);
            assert_ne!(PaymentStatus::Pending, PaymentStatus::Captured);
        }

        #[test]
        fn test_order_status_clone() {
            let status = OrderStatus::Preparing;
            let cloned = status;
            assert_eq!(status, cloned);
        }

        #[test]
        fn test_order_status_copy() {
            let status = OrderStatus::Delivered;
            let copied: OrderStatus = status; // Copy semantics
            assert_eq!(status, copied);
        }

        #[test]
        fn test_order_status_debug_format() {
            let status = OrderStatus::Cancelled;
            let debug_str = format!("{:?}", status);
            assert!(debug_str.contains("Cancelled"));
        }

        #[test]
        fn test_uuid_in_request() {
            // Ensure UUID parsing works in requests
            let uuid_str = "550e8400-e29b-41d4-a716-446655440000";
            let uuid: Uuid = uuid_str.parse().unwrap();
            let request = CreateOrderRequest {
                address_id: uuid,
                notes: None,
            };
            assert_eq!(request.address_id.to_string(), uuid_str);
        }
    }
}
