ALTER TABLE product
    ADD COLUMN IF NOT EXISTS rating DOUBLE PRECISION NOT NULL DEFAULT 4.7,
    ADD COLUMN IF NOT EXISTS origin TEXT NULL,
    ADD COLUMN IF NOT EXISTS caffeine TEXT NULL,
    ADD COLUMN IF NOT EXISTS format TEXT NULL,
    ADD COLUMN IF NOT EXISTS story TEXT NULL,
    ADD COLUMN IF NOT EXISTS tags TEXT[] NOT NULL DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS flavor_profile TEXT[] NOT NULL DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS brewing_guide TEXT[] NOT NULL DEFAULT '{}';

CREATE TABLE IF NOT EXISTS product_customization_group (
    id UUID PRIMARY KEY,
    product_id UUID NOT NULL REFERENCES product(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT NULL,
    min_select INTEGER NOT NULL DEFAULT 0,
    max_select INTEGER NOT NULL DEFAULT 1,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_on TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    modified_on TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS product_customization_option (
    id UUID PRIMARY KEY,
    group_id UUID NOT NULL REFERENCES product_customization_group(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT NULL,
    price_delta DOUBLE PRECISION NOT NULL DEFAULT 0,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_on TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    modified_on TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE cart_item
    ADD COLUMN IF NOT EXISTS selected_customizations_json JSONB NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE order_item
    ADD COLUMN IF NOT EXISTS selected_customizations_json JSONB NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE cart_item
    DROP CONSTRAINT IF EXISTS cart_item_cart_id_product_id_key;

ALTER TABLE cart_item
    ADD CONSTRAINT cart_item_cart_product_customization_key
    UNIQUE (cart_id, product_id, selected_customizations_json);

UPDATE product
SET
    rating = 4.8,
    origin = 'Nilgiris, India',
    caffeine = 'Medium',
    format = 'Loose leaf',
    story = 'A sturdy breakfast blend built for a clear, energetic start and a clean finish.',
    tags = ARRAY['morning', 'black tea', 'bold'],
    flavor_profile = ARRAY['honey', 'malt', 'bright finish'],
    brewing_guide = ARRAY['Use water just off the boil.', 'Steep for 3 to 4 minutes.', 'Best served black or with a small pour of milk.']
WHERE id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1'::uuid;

UPDATE product
SET
    rating = 4.9,
    origin = 'Assam and jasmine gardens',
    caffeine = 'Low',
    format = 'Loose leaf',
    story = 'A green tea that opens with a floral lift and settles into a silky, cooling finish.',
    tags = ARRAY['floral', 'green tea', 'bright'],
    flavor_profile = ARRAY['jasmine', 'orchid', 'soft grass'],
    brewing_guide = ARRAY['Brew at a lower temperature than black tea.', 'Steep for 2 to 3 minutes.', 'Serve plain to keep the aroma intact.']
WHERE id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2'::uuid;

UPDATE product
SET
    rating = 4.7,
    origin = 'House blend',
    caffeine = 'Medium',
    format = 'Loose leaf and spice blend',
    story = 'Our signature chai blend for teams that want a richer, spicier cup through the workday.',
    tags = ARRAY['chai', 'spiced', 'milk tea'],
    flavor_profile = ARRAY['cardamom', 'ginger', 'black pepper'],
    brewing_guide = ARRAY['Simmer with milk or water.', 'Steep until the spice reads clearly.', 'Sweeten to taste and serve hot.']
WHERE id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3'::uuid;

UPDATE product
SET
    rating = 4.6,
    origin = 'Highland oolong leaves',
    caffeine = 'Medium',
    format = 'Loose leaf',
    story = 'A lifted oolong with citrus sparkle and a mineral backbone that stays crisp over multiple pours.',
    tags = ARRAY['oolong', 'citrus', 'refined'],
    flavor_profile = ARRAY['citrus peel', 'orchard fruit', 'minerality'],
    brewing_guide = ARRAY['Use hot but not boiling water.', 'Steep for 3 minutes and re-infuse if desired.', 'Pairs well with shortbread or light snacks.']
WHERE id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa4'::uuid;

INSERT INTO product_customization_group (id, product_id, name, description, min_select, max_select, sort_order)
VALUES
    ('b1011111-1111-4111-8111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', 'Strength', 'Dial the tea body up or down.', 0, 1, 1),
    ('b1011111-1111-4111-8111-111111111112', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', 'Serving style', 'Choose how the blend should finish.', 0, 1, 2),
    ('b1022222-2222-4222-8222-222222222221', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2', 'Aroma', 'Tune the fragrance profile.', 0, 1, 1),
    ('b1022222-2222-4222-8222-222222222222', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2', 'Sweetness', 'Match the cup to your taste.', 0, 1, 2),
    ('b1033333-3333-4333-8333-333333333331', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3', 'Milk ratio', 'Pick the body of the chai.', 0, 1, 1),
    ('b1033333-3333-4333-8333-333333333332', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3', 'Spice level', 'Set the spice intensity.', 0, 1, 2),
    ('b1044444-4444-4444-8444-444444444441', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa4', 'Finish', 'Choose the last note that lingers.', 0, 1, 1),
    ('b1044444-4444-4444-8444-444444444442', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa4', 'Strength', 'Adjust the tea body.', 0, 1, 2)
ON CONFLICT (id) DO NOTHING;

INSERT INTO product_customization_option (id, group_id, name, description, price_delta, sort_order)
VALUES
    ('c1011111-1111-4111-8111-111111111111', 'b1011111-1111-4111-8111-111111111111', 'Light', 'A softer cup.', 0, 1),
    ('c1011111-1111-4111-8111-111111111112', 'b1011111-1111-4111-8111-111111111111', 'Balanced', 'The default house profile.', 12, 2),
    ('c1011111-1111-4111-8111-111111111113', 'b1011111-1111-4111-8111-111111111111', 'Bold', 'A deeper tea finish.', 18, 3),
    ('c1011111-1111-4111-8111-111111111114', 'b1011111-1111-4111-8111-111111111112', 'Black', 'Keep it clean and brisk.', 0, 1),
    ('c1011111-1111-4111-8111-111111111115', 'b1011111-1111-4111-8111-111111111112', 'Milk finish', 'Round the cup with milk.', 10, 2),
    ('c1011111-1111-4111-8111-111111111116', 'b1011111-1111-4111-8111-111111111112', 'Honeyed finish', 'A soft sweet edge.', 16, 3),
    ('c1022222-2222-4222-8222-222222222221', 'b1022222-2222-4222-8222-222222222221', 'Pure jasmine', 'Keep the floral note centered.', 0, 1),
    ('c1022222-2222-4222-8222-222222222222', 'b1022222-2222-4222-8222-222222222221', 'Citrus lift', 'Add a brighter lift.', 15, 2),
    ('c1022222-2222-4222-8222-222222222223', 'b1022222-2222-4222-8222-222222222221', 'Rose garden', 'A rounder floral finish.', 12, 3),
    ('c1022222-2222-4222-8222-222222222224', 'b1022222-2222-4222-8222-222222222222', 'Unsweetened', 'No added sweetness.', 0, 1),
    ('c1022222-2222-4222-8222-222222222225', 'b1022222-2222-4222-8222-222222222222', 'Light honey', 'A small finish of sweetness.', 10, 2),
    ('c1022222-2222-4222-8222-222222222226', 'b1022222-2222-4222-8222-222222222222', 'Classic sugar', 'The familiar balance.', 8, 3),
    ('c1033333-3333-4333-8333-333333333331', 'b1033333-3333-4333-8333-333333333331', 'Black tea', 'No milk added.', 0, 1),
    ('c1033333-3333-4333-8333-333333333332', 'b1033333-3333-4333-8333-333333333331', 'Half milk', 'A classic balanced chai.', 15, 2),
    ('c1033333-3333-4333-8333-333333333333', 'b1033333-3333-4333-8333-333333333331', 'Full milk', 'Richer and rounder.', 20, 3),
    ('c1033333-3333-4333-8333-333333333334', 'b1033333-3333-4333-8333-333333333332', 'Gentle', 'Light spice presence.', 0, 1),
    ('c1033333-3333-4333-8333-333333333335', 'b1033333-3333-4333-8333-333333333332', 'Warm', 'The house default kick.', 8, 2),
    ('c1033333-3333-4333-8333-333333333336', 'b1033333-3333-4333-8333-333333333332', 'Fire', 'A stronger spice profile.', 12, 3),
    ('c1044444-4444-4444-8444-444444444441', 'b1044444-4444-4444-8444-444444444441', 'Clean finish', 'Bright and tidy.', 0, 1),
    ('c1044444-4444-4444-8444-444444444442', 'b1044444-4444-4444-8444-444444444441', 'Peach', 'A soft fruity edge.', 12, 2),
    ('c1044444-4444-4444-8444-444444444443', 'b1044444-4444-4444-8444-444444444441', 'Honey citrus', 'Sweet and rounded.', 15, 3),
    ('c1044444-4444-4444-8444-444444444444', 'b1044444-4444-4444-8444-444444444442', 'Light', 'Keeps the tea delicate.', 0, 1),
    ('c1044444-4444-4444-8444-444444444445', 'b1044444-4444-4444-8444-444444444442', 'Medium', 'Balanced body.', 10, 2),
    ('c1044444-4444-4444-8444-444444444446', 'b1044444-4444-4444-8444-444444444442', 'Deep', 'A more assertive cup.', 18, 3)
ON CONFLICT (id) DO NOTHING;
