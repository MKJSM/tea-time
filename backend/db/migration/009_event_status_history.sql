-- Event Booking Status History
-- Tracks all status changes for event bookings (audit trail)
-- Mirrors the order_status_history pattern

CREATE TABLE IF NOT EXISTS event_booking_status_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID NOT NULL REFERENCES event_bookings(id) ON DELETE CASCADE,
    old_status TEXT,
    new_status TEXT NOT NULL,
    changed_by UUID REFERENCES users(id) ON DELETE SET NULL, -- NULL = system
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_event_booking_status_history_booking_id
    ON event_booking_status_history(booking_id);

-- Add confirmed_at / cancelled_at timestamps to event_bookings
ALTER TABLE event_bookings
    ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS cancellation_reason TEXT,
    ADD COLUMN IF NOT EXISTS admin_notes TEXT;
