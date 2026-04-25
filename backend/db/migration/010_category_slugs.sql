ALTER TABLE category
ADD COLUMN IF NOT EXISTS slug TEXT;

UPDATE category
SET slug = REGEXP_REPLACE(
    REGEXP_REPLACE(LOWER(TRIM(name)), '[^a-z0-9]+', '-', 'g'),
    '(^-|-$)',
    '',
    'g'
)
WHERE slug IS NULL OR slug = '';

ALTER TABLE category
ALTER COLUMN slug SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS category_slug_key ON category (slug);
