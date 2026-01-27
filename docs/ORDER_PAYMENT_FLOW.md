# Order & Payment Flow - Frontend Integration Guide

## Overview

This document describes the complete order and payment flow for the Tea E-Commerce platform, including API endpoints, request/response formats, and frontend integration details for Razorpay.

---

## Table of Contents

1. [Flow Diagram](#flow-diagram)
2. [Database Schema](#database-schema)
3. [API Endpoints](#api-endpoints)
4. [Frontend Integration](#frontend-integration)
5. [Error Handling](#error-handling)
6. [Status Transitions](#status-transitions)

---

## Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           ORDER & PAYMENT FLOW                               │
└─────────────────────────────────────────────────────────────────────────────┘

User Journey:
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│   Cart   │───▶│  Create  │───▶│ Initiate │───▶│ Razorpay │───▶│  Verify  │
│   Page   │    │  Order   │    │ Payment  │    │   SDK    │    │ Payment  │
└──────────┘    └──────────┘    └──────────┘    └──────────┘    └──────────┘
                     │                                               │
                     ▼                                               ▼
              Order: PENDING                                  Order: CONFIRMED
              Payment: PENDING                                Payment: CAPTURED

API Sequence:
┌────────────┐                    ┌────────────┐                    ┌────────────┐
│  Frontend  │                    │   Backend  │                    │  Razorpay  │
└─────┬──────┘                    └─────┬──────┘                    └─────┬──────┘
      │                                 │                                 │
      │  POST /api/orders               │                                 │
      │  {address_id, notes}            │                                 │
      │────────────────────────────────▶│                                 │
      │                                 │                                 │
      │  Order created (PENDING)        │                                 │
      │◀────────────────────────────────│                                 │
      │                                 │                                 │
      │  POST /api/orders/:id/pay       │                                 │
      │────────────────────────────────▶│                                 │
      │                                 │  POST /v1/orders                │
      │                                 │  {amount, currency, receipt}    │
      │                                 │────────────────────────────────▶│
      │                                 │                                 │
      │                                 │  {id: "order_xxx"}              │
      │                                 │◀────────────────────────────────│
      │                                 │                                 │
      │  {razorpay_order_id,            │                                 │
      │   razorpay_key_id, amount...}   │                                 │
      │◀────────────────────────────────│                                 │
      │                                 │                                 │
      │  ┌─────────────────────────┐    │                                 │
      │  │  Open Razorpay Checkout │    │                                 │
      │  │  SDK with order_id      │    │                                 │
      │  └─────────────────────────┘    │                                 │
      │                                 │                                 │
      │                                 │◀ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ │
      │                                 │  Webhook: payment.captured      │
      │                                 │  (Failsafe verification)        │
      │                                 │                                 │
      │  SDK Success Callback           │                                 │
      │  {payment_id, order_id, sig}    │                                 │
      │────────────────────────────────▶│                                 │
      │                                 │                                 │
      │  POST /api/payments/verify      │                                 │
      │  {razorpay_order_id,            │                                 │
      │   razorpay_payment_id,          │                                 │
      │   razorpay_signature}           │                                 │
      │────────────────────────────────▶│                                 │
      │                                 │  Verify HMAC signature          │
      │                                 │  Update Payment: CAPTURED       │
      │                                 │  Update Order: CONFIRMED        │
      │                                 │                                 │
      │  {success: true, order_id}      │                                 │
      │◀────────────────────────────────│                                 │
      │                                 │                                 │
      │  Redirect to Order Success      │                                 │
      │                                 │                                 │
```

---

## Database Schema

### Orders Table

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | UUID | Foreign key to users |
| `address_id` | UUID | Foreign key to addresses |
| `order_number` | TEXT | Human-readable (ORD-20250126-0001) |
| `status` | TEXT | pending, confirmed, preparing, out_for_delivery, delivered, cancelled |
| `subtotal` | DOUBLE | Sum of item prices |
| `tax_cgst` | DOUBLE | Central GST (5%) |
| `tax_sgst` | DOUBLE | State GST (5%) |
| `delivery_charge` | DOUBLE | Delivery fee |
| `discount` | DOUBLE | Applied discount |
| `total_amount` | DOUBLE | Final payable amount |
| `notes` | TEXT | Special instructions |

### Payments Table

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `order_id` | UUID | Foreign key to orders |
| `razorpay_order_id` | TEXT | Razorpay order ID (order_xxx) |
| `razorpay_payment_id` | TEXT | Payment ID after success (pay_xxx) |
| `razorpay_signature` | TEXT | HMAC signature for verification |
| `amount` | DOUBLE | Payment amount |
| `currency` | TEXT | INR |
| `status` | TEXT | pending, authorized, captured, failed, refunded |
| `method` | TEXT | upi, card, netbanking, wallet, cod |
| `error_code` | TEXT | Error code if failed |
| `error_description` | TEXT | Error description if failed |
| `refund_id` | TEXT | Refund ID if refunded |
| `refund_status` | TEXT | pending, processed, failed |

---

## API Endpoints

### 1. Create Order

Creates a new order from the user's cart.

```
POST /api/orders
Authorization: Required (Session Cookie)
```

**Request:**
```json
{
  "address_id": "uuid-of-delivery-address",
  "notes": "Extra hot, no sugar"  // Optional
}
```

**Response (201 Created):**
```json
{
  "id": "order-uuid",
  "order_number": "ORD-20250126-0001",
  "status": "pending",
  "subtotal": 295.00,
  "tax_cgst": 14.75,
  "tax_sgst": 14.75,
  "delivery_charge": 30.00,
  "discount": 0.00,
  "total_amount": 354.50,
  "items": [
    {
      "id": "item-uuid",
      "product_id": "product-uuid",
      "product_name": "Hot Masala Tea",
      "product_image_url": "/images/masala-tea.jpg",
      "quantity": 2,
      "unit_price": 60.00,
      "customization_price": 15.00,
      "total_price": 150.00,
      "customizations": [
        {
          "group_name": "Sugar",
          "option_name": "Brown Sugar",
          "price_modifier": 5.00
        },
        {
          "group_name": "Add-ons",
          "option_name": "Extra Ginger",
          "price_modifier": 10.00
        }
      ]
    }
  ],
  "address": {
    "recipient_name": "Jayasuriya",
    "phone_number": "+91 98765 43210",
    "street_address": "123 Main Road",
    "city": "Madurai",
    "state": "Tamil Nadu",
    "postal_code": "625014",
    "label": "Home"
  },
  "payment": null,
  "timeline": [
    {"status": "pending", "timestamp": "2025-01-26T10:30:00Z", "is_completed": true, "is_current": true},
    {"status": "confirmed", "timestamp": null, "is_completed": false, "is_current": false},
    {"status": "preparing", "timestamp": null, "is_completed": false, "is_current": false},
    {"status": "out_for_delivery", "timestamp": null, "is_completed": false, "is_current": false},
    {"status": "delivered", "timestamp": null, "is_completed": false, "is_current": false}
  ],
  "created_at": "2025-01-26T10:30:00Z"
}
```

---

### 2. Initiate Payment

Creates a Razorpay order and returns data needed for the SDK.

```
POST /api/orders/:id/pay
Authorization: Required
```

**Response (200 OK):**
```json
{
  "razorpay_order_id": "order_PqR1234567890",
  "razorpay_key_id": "rzp_test_xxxxxxxxxxxx",
  "amount": 35450,  // Amount in PAISE (354.50 * 100)
  "currency": "INR",
  "order_id": "order-uuid",
  "order_number": "ORD-20250126-0001",
  "prefill": {
    "name": "Jayasuriya",
    "email": "jay@example.com",
    "contact": "+919876543210"
  }
}
```

---

### 3. Verify Payment

Verifies the payment after Razorpay SDK callback.

```
POST /api/payments/verify
Authorization: Required
```

**Request:**
```json
{
  "razorpay_order_id": "order_PqR1234567890",
  "razorpay_payment_id": "pay_AbC1234567890",
  "razorpay_signature": "signature-from-razorpay-callback"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "order_id": "order-uuid",
  "order_number": "ORD-20250126-0001",
  "payment_id": "pay_AbC1234567890",
  "message": "Payment successful"
}
```

---

### 4. List Orders

Get user's order history.

```
GET /api/orders?status=confirmed&page=1&limit=20
Authorization: Required
```

**Response:**
```json
[
  {
    "id": "order-uuid",
    "order_number": "ORD-20250126-0001",
    "status": "confirmed",
    "total_amount": 354.50,
    "item_count": 2,
    "created_at": "2025-01-26T10:30:00Z"
  }
]
```

---

### 5. Get Order Details

```
GET /api/orders/:id
Authorization: Required
```

Returns full order details (same as create order response).

---

### 6. Cancel Order

```
POST /api/orders/:id/cancel
Authorization: Required
```

**Request:**
```json
{
  "reason": "Changed my mind"
}
```

**Response:** Full order details with status "cancelled"

---

### 7. List Payments

```
GET /api/payments?status=captured&page=1&limit=20
Authorization: Required
```

**Response:**
```json
{
  "payments": [
    {
      "id": "payment-uuid",
      "order_id": "order-uuid",
      "order_number": "ORD-20250126-0001",
      "razorpay_order_id": "order_PqR1234567890",
      "razorpay_payment_id": "pay_AbC1234567890",
      "amount": 354.50,
      "currency": "INR",
      "status": "captured",
      "method": "upi",
      "created_at": "2025-01-26T10:31:00Z"
    }
  ],
  "total_count": 10,
  "total_successful": 3545.00,
  "total_failed_count": 1,
  "total_refunded": 100.00
}
```

---

### 8. Get Payment Details

```
GET /api/payments/:id
Authorization: Required
```

---

## Frontend Integration

### Step 1: Install Razorpay SDK

Add to your HTML:
```html
<script src="https://checkout.razorpay.com/v1/checkout.js"></script>
```

Or for React/Next.js, use:
```bash
npm install razorpay
```

### Step 2: Checkout Flow Implementation

```typescript
// types.ts
interface InitiatePaymentResponse {
  razorpay_order_id: string;
  razorpay_key_id: string;
  amount: number;
  currency: string;
  order_id: string;
  order_number: string;
  prefill: {
    name: string;
    email: string;
    contact: string;
  };
}

interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

// checkout.ts
async function handleCheckout(addressId: string, notes?: string) {
  try {
    // Step 1: Create Order
    const orderResponse = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ address_id: addressId, notes })
    });

    if (!orderResponse.ok) {
      throw new Error('Failed to create order');
    }

    const order = await orderResponse.json();

    // Step 2: Initiate Payment
    const paymentResponse = await fetch(`/api/orders/${order.id}/pay`, {
      method: 'POST',
      credentials: 'include'
    });

    if (!paymentResponse.ok) {
      throw new Error('Failed to initiate payment');
    }

    const paymentData: InitiatePaymentResponse = await paymentResponse.json();

    // Step 3: Open Razorpay Checkout
    const options = {
      key: paymentData.razorpay_key_id,
      amount: paymentData.amount,
      currency: paymentData.currency,
      name: 'Sip Time',
      description: `Order ${paymentData.order_number}`,
      order_id: paymentData.razorpay_order_id,
      prefill: paymentData.prefill,
      theme: {
        color: '#4A5D23'  // Your brand color
      },
      handler: async function (response: RazorpayResponse) {
        // Step 4: Verify Payment
        await verifyPayment(response);
      },
      modal: {
        ondismiss: function() {
          // User closed the payment modal
          console.log('Payment cancelled by user');
        }
      }
    };

    const razorpay = new (window as any).Razorpay(options);
    razorpay.open();

  } catch (error) {
    console.error('Checkout error:', error);
    // Show error to user
  }
}

async function verifyPayment(razorpayResponse: RazorpayResponse) {
  try {
    const response = await fetch('/api/payments/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        razorpay_order_id: razorpayResponse.razorpay_order_id,
        razorpay_payment_id: razorpayResponse.razorpay_payment_id,
        razorpay_signature: razorpayResponse.razorpay_signature
      })
    });

    if (!response.ok) {
      throw new Error('Payment verification failed');
    }

    const result = await response.json();

    if (result.success) {
      // Redirect to success page
      window.location.href = `/orders/${result.order_id}?success=true`;
    } else {
      throw new Error(result.message);
    }

  } catch (error) {
    console.error('Payment verification error:', error);
    // Show error and retry option
  }
}
```

### Step 3: React Component Example

```tsx
// CheckoutButton.tsx
import { useState } from 'react';

interface CheckoutButtonProps {
  addressId: string;
  notes?: string;
  disabled?: boolean;
}

export function CheckoutButton({ addressId, notes, disabled }: CheckoutButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClick = async () => {
    if (!addressId) {
      setError('Please select a delivery address');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Create order
      const orderRes = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ address_id: addressId, notes })
      });

      if (!orderRes.ok) {
        const err = await orderRes.json();
        throw new Error(err.error || 'Failed to create order');
      }

      const order = await orderRes.json();

      // Initiate payment
      const payRes = await fetch(`/api/orders/${order.id}/pay`, {
        method: 'POST',
        credentials: 'include'
      });

      if (!payRes.ok) {
        throw new Error('Failed to initiate payment');
      }

      const payData = await payRes.json();

      // Load Razorpay
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => {
        const options = {
          key: payData.razorpay_key_id,
          amount: payData.amount,
          currency: payData.currency,
          name: 'Sip Time',
          description: `Order ${payData.order_number}`,
          order_id: payData.razorpay_order_id,
          prefill: payData.prefill,
          handler: async (response: any) => {
            // Verify payment
            const verifyRes = await fetch('/api/payments/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature
              })
            });

            const result = await verifyRes.json();
            if (result.success) {
              window.location.href = `/orders/${result.order_id}?success=true`;
            } else {
              setError('Payment verification failed');
            }
          }
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.open();
      };
      document.body.appendChild(script);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {error && <p className="text-red-500 mb-2">{error}</p>}
      <button
        onClick={handleClick}
        disabled={disabled || loading}
        className="w-full bg-green-600 text-white py-3 rounded-lg disabled:opacity-50"
      >
        {loading ? 'Processing...' : 'Place Order & Pay'}
      </button>
    </div>
  );
}
```

---

## Error Handling

### API Error Responses

```json
// 400 Bad Request
{
  "error": "Cart is empty"
}

// 401 Unauthorized
{
  "error": "Authentication required"
}

// 403 Forbidden
{
  "error": "Not authorized"
}

// 404 Not Found
{
  "error": "Order not found"
}

// 500 Internal Server Error
{
  "error": "Failed to create payment order"
}
```

### Common Error Scenarios

| Scenario | Error Message | User Action |
|----------|---------------|-------------|
| Empty cart | "Cart is empty" | Add items to cart |
| Invalid address | "Address not found" | Select valid address |
| Order already paid | "Order is not in pending state" | View existing order |
| Payment failed | "Payment verification failed" | Retry payment |
| Network error | Connection error | Check internet and retry |

---

## Status Transitions

### Order Status Flow

```
                 ┌──────────┐
                 │ PENDING  │
                 └────┬─────┘
                      │
         Payment      │      Cancel
         Success      │      Request
              ┌───────┴───────┐
              ▼               ▼
        ┌───────────┐   ┌───────────┐
        │ CONFIRMED │   │ CANCELLED │
        └─────┬─────┘   └───────────┘
              │
              ▼
        ┌───────────┐
        │ PREPARING │
        └─────┬─────┘
              │
              ▼
    ┌─────────────────────┐
    │ OUT_FOR_DELIVERY    │
    └─────────┬───────────┘
              │
              ▼
        ┌───────────┐
        │ DELIVERED │
        └───────────┘
```

### Payment Status Flow

```
        ┌─────────┐
        │ PENDING │
        └────┬────┘
             │
    ┌────────┼────────┐
    ▼        ▼        ▼
┌────────┐ ┌────────┐ ┌────────┐
│CAPTURED│ │ FAILED │ │AUTHORIZED│
└────┬───┘ └────────┘ └────┬───┘
     │                     │
     │    Refund           │ Capture
     │    Request          │
     ▼                     ▼
┌────────┐           ┌────────┐
│REFUNDED│           │CAPTURED│
└────────┘           └────────┘
```

---

## Environment Variables

```bash
# Backend (.env)
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxx
RAZORPAY_KEY_SECRET=your_secret_key

# For production
RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxxxx
RAZORPAY_KEY_SECRET=your_live_secret_key
```

---

## Webhook Setup (Recommended)

For production, set up Razorpay webhooks as a failsafe:

1. Go to Razorpay Dashboard → Settings → Webhooks
2. Add webhook URL: `https://your-domain.com/api/webhooks/razorpay`
3. Select events: `payment.captured`, `payment.failed`, `refund.created`
4. Copy the webhook secret

## Webhook Setup (Recommended)

For production, set up Razorpay webhooks as a failsafe:

1. Go to Razorpay Dashboard → Settings → Webhooks
2. Add webhook URL: `https://your-domain.com/api/webhooks/razorpay`
3. Select events: `payment.captured`, `payment.failed`, `refund.created`
4. Copy the webhook secret

The backend implementation automatically verifies the webhook signature using `RAZORPAY_WEBHOOK_SECRET` and stores the raw response in the `razorpay_webhook_payload` column of the `payments` table. Webhooks ensure order confirmation even if the user closes the browser before the client-side callback completes.

---

## Testing

### Test Cards (Razorpay Test Mode)

| Card Number | CVV | Expiry | Description |
|-------------|-----|--------|-------------|
| 4111 1111 1111 1111 | Any | Any future | Success |
| 4000 0000 0000 0002 | Any | Any future | Decline |

### Test UPI

| UPI ID | Description |
|--------|-------------|
| success@razorpay | Successful payment |
| failure@razorpay | Failed payment |

---

## Summary

1. **Create Order** → Converts cart to pending order
2. **Initiate Payment** → Creates Razorpay order, returns SDK data
3. **Razorpay SDK** → User completes payment
4. **Verify Payment** → Backend verifies signature, confirms order
5. **Success Page** → Show order confirmation

The flow ensures:
- ✅ Order is created BEFORE payment attempt (audit trail)
- ✅ Payment is verified server-side (security)
- ✅ Idempotent verification (handles retries)
- ✅ Refund support for cancelled orders
