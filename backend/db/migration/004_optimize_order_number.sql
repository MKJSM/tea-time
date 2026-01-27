-- Create a table to track daily order counts for O(1) order number generation
CREATE TABLE IF NOT EXISTS order_daily_sequences (
    date_key DATE PRIMARY KEY DEFAULT CURRENT_DATE,
    current_count INTEGER DEFAULT 0
);

-- Function to generate order number using the sequence table
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT AS $$
DECLARE
    today_date_str TEXT;
    seq_count INTEGER;
BEGIN
    today_date_str := TO_CHAR(NOW(), 'YYYYMMDD');
    
    -- Atomic UPSERT to get/increment the counter
    INSERT INTO order_daily_sequences (date_key, current_count)
    VALUES (CURRENT_DATE, 1)
    ON CONFLICT (date_key) DO UPDATE
    SET current_count = order_daily_sequences.current_count + 1
    RETURNING current_count INTO seq_count;

    RETURN 'ORD-' || today_date_str || '-' || LPAD(seq_count::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;
