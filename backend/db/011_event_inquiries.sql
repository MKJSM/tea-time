-- Create event_inquiries table for storing comprehensive event catering requests
CREATE TABLE IF NOT EXISTS event_inquiries (
    id UUID PRIMARY KEY,
    
    -- Contact Information
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    
    -- Event Details
    event_type VARCHAR(100) NOT NULL,
    event_name VARCHAR(255),
    event_date VARCHAR(50),
    event_time VARCHAR(50),
    event_duration_hours INTEGER,
    
    -- Guest Information
    total_guests INTEGER NOT NULL,
    adult_count INTEGER NOT NULL DEFAULT 0,
    kid_count INTEGER NOT NULL DEFAULT 0,
    
    -- Venue Information
    venue_name VARCHAR(255),
    venue_address TEXT,
    venue_type VARCHAR(100), -- indoor/outdoor/both
    
    -- Service Requirements
    selected_products JSONB NOT NULL DEFAULT '[]'::jsonb,
    
    -- Assets/Equipment Needed
    needs_tea_flasks BOOLEAN DEFAULT false,
    flask_quantity INTEGER DEFAULT 0,
    needs_cups BOOLEAN DEFAULT false,
    cup_quantity INTEGER DEFAULT 0,
    needs_teapots BOOLEAN DEFAULT false,
    teapot_quantity INTEGER DEFAULT 0,
    needs_serving_staff BOOLEAN DEFAULT false,
    staff_count INTEGER DEFAULT 0,
    needs_setup_service BOOLEAN DEFAULT false,
    needs_cleanup_service BOOLEAN DEFAULT false,
    
    -- Additional Equipment
    additional_equipment JSONB DEFAULT '[]'::jsonb, -- [{item: "sugar bowls", quantity: 10}, ...]
    
    -- Budget & Preferences
    budget_range VARCHAR(100),
    service_style VARCHAR(100), -- buffet/table-service/self-serve
    dietary_restrictions TEXT,
    special_requirements TEXT,
    
    -- Status & Tracking
    status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending/contacted/quoted/confirmed/completed/cancelled
    admin_notes TEXT,
    quoted_amount DECIMAL(10, 2),
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    contacted_at TIMESTAMPTZ,
    confirmed_at TIMESTAMPTZ
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_event_inquiries_email ON event_inquiries(email);
CREATE INDEX IF NOT EXISTS idx_event_inquiries_phone ON event_inquiries(phone);
CREATE INDEX IF NOT EXISTS idx_event_inquiries_status ON event_inquiries(status);
CREATE INDEX IF NOT EXISTS idx_event_inquiries_created_at ON event_inquiries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_event_inquiries_event_date ON event_inquiries(event_date);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_event_inquiry_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER event_inquiry_updated_at
    BEFORE UPDATE ON event_inquiries
    FOR EACH ROW
    EXECUTE FUNCTION update_event_inquiry_updated_at();
