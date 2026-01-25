-- Seed Data

INSERT INTO products (
    name, description, base_price, category, image_url, stock_quantity, sku,
    rating, origin, caffeine, format, 
    brewing_guide,
    story, tags,
    flavor_profile
) VALUES
(
    'Hot Masala Tea', 
    'Aromatic blend of premium tea leaves with traditional Indian spices', 
    45.0, 
    'Tea', 
    'https://images.unsplash.com/photo-1571934811356-5cc061b6821f?q=80&w=1167&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D', 
    100, 
    'TEA-001',
    4.8, 'Assam, India', 'High', 'Loose Leaf',
    '{"temperature": 95.0, "time": 4.0, "instructions": "Boil water, add 1tsp tea, steep for 4 mins. Add milk and sugar to taste."}',
    'A traditional Indian chai blend, passed down through generations. Perfect for starting your day with energy and warmth.',
    '["Spiced", "Traditional", "Morning"]',
    '{"floral": 0.3, "grassy": 0.2, "nutty": 0.4, "sweet": 0.5, "earthy": 0.6, "spicy": 0.8}'
),
(
    'Strong Filter Coffee', 
    'South Indian style filter coffee with rich aroma and bold flavor', 
    60.0, 
    'Coffee', 
    'https://images.unsplash.com/photo-1544787219-7f47ccb76574?q=80&w=721&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D', 
    100, 
    'COF-001',
    4.9, 'Coorg, India', 'High', 'Powder',
    '{"temperature": 90.0, "time": 5.0, "instructions": "Use a traditional coffee filter. Add powder, pour hot water, let it drip. Mix with hot milk and sugar."}',
    'Sourced from the hills of Coorg, our filter coffee offers an authentic South Indian experience in every sip.',
    '["Bold", "Traditional", "Energy"]',
    '{"floral": 0.1, "grassy": 0.1, "nutty": 0.7, "sweet": 0.2, "earthy": 0.8, "spicy": 0.1}'
),
(
    'Plain Tea', 
    'Classic Plain Tea with perfect blend of tea leaves and milk', 
    35.0, 
    'Tea', 
    'https://images.unsplash.com/photo-1562547256-2c5ee93b60b7?q=80&w=741&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D', 
    100, 
    'TEA-002',
    4.5, 'Darjeeling, India', 'Medium', 'Tea Bags',
    '{"temperature": 85.0, "time": 3.0, "instructions": "Steep tea bag in hot water for 3 minutes. Remove and enjoy."}',
    'Simple, elegant, and timeless. Our plain tea allows the pure flavor of the leaves to shine through.',
    '["Classic", "Simple", "Everyday"]',
    '{"floral": 0.6, "grassy": 0.4, "nutty": 0.2, "sweet": 0.3, "earthy": 0.2, "spicy": 0.0}'
),
(
    'Rose Milk', 
    'Refreshing rose-flavored milk with a delicate floral aroma', 
    50.0, 
    'Milk', 
    'https://images.unsplash.com/photo-1556679343-c7306c1976bc?q=80&w=800&auto=format&fit=crop', 
    100, 
    'MILK-001',
    4.7, 'Local Dairy', 'None', 'Ready to Drink',
    '{"temperature": 0.0, "time": 0.0, "instructions": "Serve chilled."}',
    'A cooling summer drink made with fresh milk and premium rose syrup.',
    '["Sweet", "Cooling", "Floral"]',
    '{"floral": 1.0, "grassy": 0.0, "nutty": 0.1, "sweet": 0.9, "earthy": 0.0, "spicy": 0.0}'
),
(
    'Strawberry Thick Shake', 
    'A cool & creamy summer delight with fresh strawberry flavor', 
    80.0, 
    'Shake', 
    'https://images.unsplash.com/photo-1597481499666-130f8eb2c9cd?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D', 
    100, 
    'SHK-001',
    4.8, 'Local Dairy', 'None', 'Ready to Drink',
    '{"temperature": 0.0, "time": 0.0, "instructions": "Serve chilled."}',
    'Thick, creamy, and bursting with real strawberry flavor. A favorite for kids and adults alike.',
    '["Fruity", "Sweet", "Indulgent"]',
    '{"floral": 0.4, "grassy": 0.0, "nutty": 0.1, "sweet": 0.9, "earthy": 0.0, "spicy": 0.0}'
),
(
    'Palm Fruit Thick Shake', 
    'A cool & creamy summer delight with natural palm fruit', 
    85.0, 
    'Shake', 
    'https://images.unsplash.com/photo-1572490122747-3968b75cc699?q=80&w=800&auto=format&fit=crop', 
    100, 
    'SHK-002',
    4.6, 'Tropical', 'None', 'Ready to Drink',
    '{"temperature": 0.0, "time": 0.0, "instructions": "Serve chilled."}',
    'Exotic, refreshing, and unique. Experience the taste of the tropics with our Palm Fruit Shake.',
    '["Tropical", "Unique", "Summer"]',
    '{"floral": 0.2, "grassy": 0.1, "nutty": 0.3, "sweet": 0.8, "earthy": 0.1, "spicy": 0.0}'
);

-- Seed Customization Groups
INSERT INTO customization_groups (id, name, description, input_type, min_selections, max_selections, is_required) VALUES
(1, 'Size', 'Select cup size', 'radio', 1, 1, 1),
(2, 'Sugar Level', 'Select sugar preference', 'radio', 1, 1, 1),
(3, 'Temperature', 'Select serving temperature', 'radio', 1, 1, 1);

-- Seed Customization Options
INSERT INTO customization_options (group_id, name, price_modifier, is_default, display_order) VALUES
-- Size
(1, 'Small (250ml)', 0.0, 1, 1),
(1, 'Medium (350ml)', 20.0, 0, 2),
(1, 'Large (500ml)', 40.0, 0, 3),
-- Sugar
(2, 'No Sugar', 0.0, 0, 1),
(2, 'Less Sugar', 0.0, 0, 2),
(2, 'Normal', 0.0, 1, 3),
(2, 'Extra Sweet', 0.0, 0, 4),
-- Temperature
(3, 'Hot', 0.0, 1, 1),
(3, 'Cold', 0.0, 0, 2);

-- Link Customizations to Products
-- Tea/Coffee (1,2,3) -> All groups
INSERT INTO product_customizations (product_id, group_id, display_order) VALUES
(1, 1, 1), (1, 2, 2), (1, 3, 3),
(2, 1, 1), (2, 2, 2), (2, 3, 3),
(3, 1, 1), (3, 2, 2), (3, 3, 3);

-- Milk/Shake (4,5,6) -> Size, Sugar
INSERT INTO product_customizations (product_id, group_id, display_order) VALUES
(4, 1, 1), (4, 2, 2),
(5, 1, 1), (5, 2, 2),
(6, 1, 1), (6, 2, 2);