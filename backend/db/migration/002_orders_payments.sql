-- Orders Table
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    address_id UUID NOT NULL REFERENCES addresses(id) ON DELETE RESTRICT,

    -- Human-readable order number (e.g., ORD-20250126-0001)
    order_number TEXT UNIQUE NOT NULL,

    -- Order Status: pending -> confirmed -> preparing -> out_for_delivery -> delivered
    --               pending -> cancelled (can cancel from pending/confirmed)
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
        'pending',           -- Order created, awaiting payment
        'confirmed',         -- Payment successful
        'preparing',         -- Kitchen is preparing
        'out_for_delivery',  -- Handed to delivery partner
        'delivered',         -- Successfully delivered
        'cancelled'          -- Order cancelled
    )),

    -- Amount breakdown (all in decimal, e.g., 100.00 for Rs.100)
    subtotal DOUBLE PRECISION NOT NULL,
    tax_cgst DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    tax_sgst DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    delivery_charge DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    discount DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    total_amount DOUBLE PRECISION NOT NULL,

    -- Optional notes
    notes TEXT,

    -- Delivery partner info (populated when out for delivery)
    delivery_partner_name TEXT,
    delivery_partner_phone TEXT,

    -- Timestamps
    confirmed_at TIMESTAMPTZ,
    preparing_at TIMESTAMPTZ,
    out_for_delivery_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    cancellation_reason TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER update_orders_updated_at
    BEFORE UPDATE ON orders
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

-- Order Items Table (snapshot of cart items at order time)
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
        product_name TEXT NOT NULL,
        product_image_urls TEXT[] DEFAULT '{}',
        quantity INTEGER NOT NULL CHECK (quantity > 0),
        unit_price DOUBLE PRECISION NOT NULL,
    
    customization_price DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    total_price DOUBLE PRECISION NOT NULL,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Order Item Customizations (snapshot of customizations at order time)
CREATE TABLE order_item_customizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_item_id UUID NOT NULL REFERENCES order_items(id) ON DELETE CASCADE,

    -- Reference IDs (may be null if customization deleted)
    group_id UUID REFERENCES customization_groups(id) ON DELETE SET NULL,
    option_id UUID REFERENCES customization_options(id) ON DELETE SET NULL,

    -- Snapshot data (preserved for order history)
    group_name TEXT NOT NULL,
    option_name TEXT NOT NULL,
    price_modifier DOUBLE PRECISION NOT NULL DEFAULT 0.0,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payments Table
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE RESTRICT,

    -- Razorpay identifiers
    razorpay_order_id TEXT UNIQUE NOT NULL,      -- Created when initiating payment
    razorpay_payment_id TEXT UNIQUE,             -- Received after successful payment
    razorpay_signature TEXT,                      -- For verification

    -- Amount info
    amount DOUBLE PRECISION NOT NULL,
    currency TEXT NOT NULL DEFAULT 'INR',

    -- Payment Status
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
        'pending',      -- Razorpay order created, awaiting payment
        'authorized',   -- Payment authorized but not captured
        'captured',     -- Payment successful and captured
        'failed',       -- Payment failed
        'refunded'      -- Full refund processed
    )),

    -- Payment method (populated after payment)
    method TEXT CHECK (method IN ('upi', 'card', 'netbanking', 'wallet', 'cod', NULL)),

    -- Error info (if failed)
    error_code TEXT,
    error_description TEXT,

    -- Refund info
    refund_id TEXT,
    refund_status TEXT CHECK (refund_status IN ('pending', 'processed', 'failed', NULL)),
    refunded_at TIMESTAMPTZ,
    refund_amount DOUBLE PRECISION,

    -- Webhook tracking
    webhook_verified BOOLEAN DEFAULT FALSE,
    webhook_received_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER update_payments_updated_at
    BEFORE UPDATE ON payments
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

-- Order Status History (audit trail)
CREATE TABLE order_status_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    from_status TEXT,
    to_status TEXT NOT NULL,
    changed_by UUID REFERENCES users(id),  -- NULL if system/webhook
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Performance Indexes
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_order_number ON orders(order_number);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);

CREATE INDEX idx_order_items_order_id ON order_items(order_id);

CREATE INDEX idx_payments_order_id ON payments(order_id);
CREATE INDEX idx_payments_razorpay_order_id ON payments(razorpay_order_id);
CREATE INDEX idx_payments_razorpay_payment_id ON payments(razorpay_payment_id);
CREATE INDEX idx_payments_status ON payments(status);

CREATE INDEX idx_order_status_history_order_id ON order_status_history(order_id);

-- Function to generate order number with advisory lock to prevent race conditions
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT AS $$
DECLARE
    today_date TEXT;
    today_count INTEGER;
    new_order_number TEXT;
    lock_id BIGINT;
BEGIN
    today_date := TO_CHAR(NOW(), 'YYYYMMDD');

    -- Generate a unique lock ID based on the date to serialize order number generation
    -- Using hashtext to convert date string to a stable integer
    lock_id := hashtext('order_number_' || today_date);

    -- Acquire advisory lock for this specific date (will wait if another transaction holds it)
    PERFORM pg_advisory_xact_lock(lock_id);

    SELECT COUNT(*) + 1 INTO today_count
    FROM orders
    WHERE order_number LIKE 'ORD-' || today_date || '-%';

    new_order_number := 'ORD-' || today_date || '-' || LPAD(today_count::TEXT, 4, '0');

    RETURN new_order_number;
END;
$$ LANGUAGE plpgsql;
