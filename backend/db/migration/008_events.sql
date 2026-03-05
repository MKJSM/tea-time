-- Event Bookings Table
-- Stores catering quote requests for events (weddings, corporate events, etc.)
-- These are enquiries only — actual payment is handled offline after admin callback

CREATE TABLE IF NOT EXISTS event_bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Optional link to authenticated user
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,

    -- Contact details (always captured for guest + auth users)
    contact_name TEXT NOT NULL,
    contact_phone TEXT NOT NULL,
    contact_email TEXT NOT NULL,

    -- Event identity
    event_name TEXT NOT NULL,
    event_type TEXT NOT NULL, -- 'wedding' | 'corporate' | 'birthday' | 'anniversary' | 'other'
    event_date DATE NOT NULL,
    time_slot TEXT NOT NULL,  -- 'morning' | 'afternoon' | 'evening'
    venue_address TEXT NOT NULL,

    -- Headcount breakdown
    headcount_total INTEGER NOT NULL CHECK (headcount_total > 0),
    headcount_adults INTEGER NOT NULL DEFAULT 0 CHECK (headcount_adults >= 0),
    headcount_kids INTEGER NOT NULL DEFAULT 0 CHECK (headcount_kids >= 0),
    headcount_seniors INTEGER NOT NULL DEFAULT 0 CHECK (headcount_seniors >= 0),

    -- Selected products as JSON array: [{product_id, product_name, quantity, unit_price}]
    selected_items JSONB NOT NULL DEFAULT '[]',

    -- Estimated pricing (calculated by frontend, stored for admin reference)
    estimated_base DOUBLE PRECISION NOT NULL DEFAULT 0,
    estimated_deposit DOUBLE PRECISION NOT NULL DEFAULT 0, -- flask security deposit
    estimated_delivery DOUBLE PRECISION NOT NULL DEFAULT 0,
    estimated_tax DOUBLE PRECISION NOT NULL DEFAULT 0,
    estimated_total DOUBLE PRECISION NOT NULL DEFAULT 0,

    -- Additional info
    notes TEXT,

    -- Lifecycle
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending' | 'confirmed' | 'cancelled'

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_event_bookings_user_id ON event_bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_event_bookings_status ON event_bookings(status);
CREATE INDEX IF NOT EXISTS idx_event_bookings_event_date ON event_bookings(event_date);

DO $$ BEGIN
    CREATE TRIGGER update_event_bookings_updated_at
        BEFORE UPDATE ON event_bookings
        FOR EACH ROW
        EXECUTE PROCEDURE update_updated_at_column();
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;
