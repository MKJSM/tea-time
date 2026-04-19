INSERT INTO category (id, name, images)
VALUES
    ('11111111-1111-1111-1111-111111111111', 'Black Tea', ARRAY[
        'https://images.unsplash.com/photo-1515823064-d6e0c04616a7?auto=format&fit=crop&w=1200&q=80'
    ]),
    ('22222222-2222-2222-2222-222222222222', 'Green Tea', ARRAY[
        'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1200&q=80'
    ]),
    ('33333333-3333-3333-3333-333333333333', 'Event Service', ARRAY[
        'https://images.unsplash.com/photo-1521017432531-fbd92d768814?auto=format&fit=crop&w=1200&q=80'
    ])
ON CONFLICT (id) DO NOTHING;

INSERT INTO product (id, name, images, price, description)
VALUES
    (
        'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1',
        'Mountain Breakfast',
        ARRAY['https://images.unsplash.com/photo-1470337458703-46ad1756a187?auto=format&fit=crop&w=1200&q=80'],
        420,
        'A bold black tea with honeyed depth and a clean morning finish.'
    ),
    (
        'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2',
        'Jasmine Cloud',
        ARRAY['https://images.unsplash.com/photo-1464306076886-da185f6a9d05?auto=format&fit=crop&w=1200&q=80'],
        460,
        'A fragrant green tea layered with soft jasmine and a bright lift.'
    ),
    (
        'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3',
        'Masala Ember',
        ARRAY['https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=1200&q=80'],
        390,
        'A house chai blend built for milk, spice, and repeat pours.'
    ),
    (
        'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa4',
        'Citrus Oolong',
        ARRAY['https://images.unsplash.com/photo-1511920170033-f8396924c348?auto=format&fit=crop&w=1200&q=80'],
        510,
        'Structured oolong with citrus peel aroma and a mineral finish.'
    )
ON CONFLICT (id) DO NOTHING;

INSERT INTO category_product (category_id, product_id)
VALUES
    ('11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1'),
    ('11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3'),
    ('22222222-2222-2222-2222-222222222222', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2'),
    ('22222222-2222-2222-2222-222222222222', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa4'),
    ('33333333-3333-3333-3333-333333333333', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3')
ON CONFLICT DO NOTHING;
