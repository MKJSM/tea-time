-- Migration: Add JSON storage for banner content
ALTER TABLE banner
    ADD COLUMN IF NOT EXISTS content_json JSONB NULL;
