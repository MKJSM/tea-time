CREATE TABLE IF NOT EXISTS homepage_page (
    id UUID PRIMARY KEY,
    slug TEXT NOT NULL UNIQUE DEFAULT 'home',
    title TEXT NOT NULL,
    subtitle TEXT NULL,
    description TEXT NULL,
    content_json JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_published BOOLEAN NOT NULL DEFAULT FALSE,
    published_on TIMESTAMPTZ NULL,
    created_on TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    modified_on TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO homepage_page (id, slug, title, subtitle, description, content_json, is_published, published_on)
SELECT
    '11111111-1111-1111-1111-111111111111'::uuid,
    'home',
    'Homepage',
    NULL,
    NULL,
    '[]'::jsonb,
    FALSE,
    NULL
WHERE NOT EXISTS (
    SELECT 1 FROM homepage_page WHERE slug = 'home'
);
