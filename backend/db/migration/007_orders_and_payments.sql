CREATE TABLE IF NOT EXISTS customer_order (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    address_id UUID NOT NULL REFERENCES address(id),
    order_number TEXT NOT NULL UNIQUE,
    status TEXT NOT NULL CHECK (status IN ('placed', 'paid', 'cancelled', 'completed')),
    payment_status TEXT NOT NULL CHECK (payment_status IN ('pending', 'authorized', 'paid', 'failed', 'refunded')),
    subtotal_amount DOUBLE PRECISION NOT NULL,
    total_amount DOUBLE PRECISION NOT NULL,
    currency TEXT NOT NULL DEFAULT 'INR',
    recipient_name TEXT NOT NULL,
    recipient_phone TEXT NOT NULL,
    line_1 TEXT NOT NULL,
    line_2 TEXT NULL,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    postal_code TEXT NOT NULL,
    country TEXT NOT NULL,
    landmark TEXT NULL,
    placed_on TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_on TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    modified_on TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS order_item (
    id UUID PRIMARY KEY,
    order_id UUID NOT NULL REFERENCES customer_order(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES product(id),
    product_name_snapshot TEXT NOT NULL,
    unit_price DOUBLE PRECISION NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    line_total DOUBLE PRECISION NOT NULL
);

CREATE TABLE IF NOT EXISTS payment (
    id UUID PRIMARY KEY,
    order_id UUID NOT NULL REFERENCES customer_order(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    provider TEXT NOT NULL DEFAULT 'razorpay',
    provider_order_id TEXT NULL UNIQUE,
    provider_payment_id TEXT NULL UNIQUE,
    provider_signature TEXT NULL,
    status TEXT NOT NULL CHECK (status IN ('pending', 'authorized', 'paid', 'failed', 'refunded')),
    amount DOUBLE PRECISION NOT NULL,
    currency TEXT NOT NULL DEFAULT 'INR',
    failure_reason TEXT NULL,
    paid_on TIMESTAMPTZ NULL,
    created_on TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    modified_on TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payment_event (
    id UUID PRIMARY KEY,
    payment_id UUID NOT NULL REFERENCES payment(id) ON DELETE CASCADE,
    provider_event_id TEXT NULL,
    event_type TEXT NOT NULL,
    payload_json JSONB NOT NULL,
    created_on TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
