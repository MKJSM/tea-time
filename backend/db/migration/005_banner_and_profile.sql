ALTER TABLE "user"
ADD COLUMN IF NOT EXISTS avatar_url TEXT NULL;

CREATE TABLE IF NOT EXISTS banner (
    id UUID PRIMARY KEY,
    title TEXT NOT NULL,
    subtitle TEXT NULL,
    description TEXT NULL,
    primary_button_label TEXT NULL,
    primary_button_href TEXT NULL,
    secondary_button_label TEXT NULL,
    secondary_button_href TEXT NULL,
    media_url TEXT NULL,
    media_kind TEXT NOT NULL DEFAULT 'image' CHECK (media_kind IN ('image', 'video')),
    background_type TEXT NOT NULL DEFAULT 'image' CHECK (background_type IN ('image', 'video', 'gradient', 'solid')),
    background_value TEXT NULL,
    overlay_color TEXT NULL,
    text_color TEXT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_on TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    modified_on TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
