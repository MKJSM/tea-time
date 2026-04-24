ALTER TABLE banner
    ADD COLUMN IF NOT EXISTS content_mode TEXT NOT NULL DEFAULT 'structured' CHECK (content_mode IN ('structured', 'html'));

ALTER TABLE banner
    ADD COLUMN IF NOT EXISTS content_html TEXT NULL;

UPDATE banner
SET content_mode = 'structured'
WHERE content_mode IS NULL;
