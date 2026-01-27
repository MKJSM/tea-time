-- Migration to add razorpay_webhook_payload to payments
ALTER TABLE payments ADD COLUMN IF NOT EXISTS razorpay_webhook_payload JSONB;
