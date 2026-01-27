-- Migration to add image_url and theme to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS theme TEXT NOT NULL DEFAULT 'light' CHECK (theme IN ('light', 'dark'));
