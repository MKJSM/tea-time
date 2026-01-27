-- Seed data for Mobilitea menu
-- All IDs are UUIDs

-- Clean existing data
DELETE FROM cart_item_customizations;
DELETE FROM cart_items;
DELETE FROM carts;
DELETE FROM favorites;
DELETE FROM product_customizations;
DELETE FROM customization_options;
DELETE FROM customization_groups;
DELETE FROM products;
DELETE FROM sessions;
DELETE FROM addresses;
DELETE FROM users;

-- ============================================
-- USERS
-- ============================================

-- Admin User (Password: password123)
INSERT INTO users (id, name, email, phone, password_hash, role) VALUES
('11111111-1111-4000-8000-000000000001', 'Admin User', 'admin@mobilitea.com', '1234567890', '$argon2id$v=19$m=19456,t=2,p=1$zlgMba7c1asJ7QFblU3AhQ$EEn0akx+COpoNo+T9CYDT+x4niiJuLDq4bsK+8cnIYI', 'admin');

-- Regular Customer (Password: password123)
INSERT INTO users (id, name, email, phone, password_hash, role) VALUES
('22222222-2222-4000-8000-000000000002', 'Test Customer', 'customer@example.com', '9876543210', '$argon2id$v=19$m=19456,t=2,p=1$zlgMba7c1asJ7QFblU3AhQ$EEn0akx+COpoNo+T9CYDT+x4niiJuLDq4bsK+8cnIYI', 'customer');

-- ============================================
-- CUSTOMIZATION GROUPS (UUIDs)
-- ============================================

-- Group 1: Tea Size
INSERT INTO customization_groups (id, name, description, input_type, min_selections, max_selections, is_required) VALUES
('a1b2c3d4-1111-4000-8000-000000000001', 'Size', 'Select flask size', 'radio', 1, 1, TRUE);

-- Group 2: Quality
INSERT INTO customization_groups (id, name, description, input_type, min_selections, max_selections, is_required) VALUES
('a1b2c3d4-2222-4000-8000-000000000002', 'Quality', 'Select quality tier', 'radio', 1, 1, TRUE);

-- Group 3: Coffee Size
INSERT INTO customization_groups (id, name, description, input_type, min_selections, max_selections, is_required) VALUES
('a1b2c3d4-3333-4000-8000-000000000003', 'Size', 'Select flask size', 'radio', 1, 1, TRUE);

-- ============================================
-- CUSTOMIZATION OPTIONS (UUIDs)
-- ============================================

-- Tea Size Options (Group 1)
INSERT INTO customization_options (id, group_id, name, price_modifier, is_default, display_order) VALUES
('b1b2c3d4-1001-4000-8000-000000000001', 'a1b2c3d4-1111-4000-8000-000000000001', '350 ml', 0.00, TRUE, 1),
('b1b2c3d4-1002-4000-8000-000000000002', 'a1b2c3d4-1111-4000-8000-000000000001', '500 ml', 15.00, FALSE, 2),
('b1b2c3d4-1003-4000-8000-000000000003', 'a1b2c3d4-1111-4000-8000-000000000001', '1 Liter', 75.00, FALSE, 3);

-- Quality Options (Group 2)
INSERT INTO customization_options (id, group_id, name, price_modifier, is_default, display_order) VALUES
('b1b2c3d4-2001-4000-8000-000000000004', 'a1b2c3d4-2222-4000-8000-000000000002', 'Economy', 0.00, TRUE, 1),
('b1b2c3d4-2002-4000-8000-000000000005', 'a1b2c3d4-2222-4000-8000-000000000002', 'Premium', 15.00, FALSE, 2);

-- Coffee Size Options (Group 3)
INSERT INTO customization_options (id, group_id, name, price_modifier, is_default, display_order) VALUES
('b1b2c3d4-3001-4000-8000-000000000006', 'a1b2c3d4-3333-4000-8000-000000000003', '350 ml', 0.00, TRUE, 1),
('b1b2c3d4-3002-4000-8000-000000000007', 'a1b2c3d4-3333-4000-8000-000000000003', '500 ml', 20.00, FALSE, 2),
('b1b2c3d4-3003-4000-8000-000000000008', 'a1b2c3d4-3333-4000-8000-000000000003', '1 Liter', 85.00, FALSE, 3);

-- ============================================
-- PRODUCTS - CORE FLASKS (UUIDs)
-- ============================================

-- Tea Flask
INSERT INTO products (id, name, description, base_price, category, image_urls, is_active, sku, stock_quantity, rating, origin, caffeine, format, tags, flavor_profile)
VALUES ('c1c2c3d4-0001-4000-8000-000000000001', 'Tea Flask', 'Fresh brewed tea delivered in a convenient flask. Select size and quality.', 45.00, '["Flask", "Hot Beverage", "Tea"]', '{"/2026/product/tea-flask.png"}', TRUE, 'TEA-FLASK', 999, 4.8, 'India', 'Medium', 'Flask', 'tea,flask,hot-beverage', 'Bold, Aromatic');

-- Coffee Flask
INSERT INTO products (id, name, description, base_price, category, image_urls, is_active, sku, stock_quantity, rating, origin, caffeine, format, tags, flavor_profile)
VALUES ('c1c2c3d4-0002-4000-8000-000000000002', 'Coffee Flask', 'Fresh brewed coffee delivered in a convenient flask. Select size and quality.', 50.00, '["Flask", "Hot Beverage", "Coffee"]', '{"/2026/product/coffee-flask.png"}', TRUE, 'COF-FLASK', 999, 4.7, 'India', 'High', 'Flask', 'coffee,flask,hot-beverage', 'Strong, Robust');

-- ============================================
-- PRODUCT CUSTOMIZATIONS LINKS
-- ============================================

-- Tea Flask -> Size (Group 1), Quality (Group 2)
INSERT INTO product_customizations (product_id, group_id, display_order) VALUES
('c1c2c3d4-0001-4000-8000-000000000001', 'a1b2c3d4-1111-4000-8000-000000000001', 1),
('c1c2c3d4-0001-4000-8000-000000000001', 'a1b2c3d4-2222-4000-8000-000000000002', 2);

-- Coffee Flask -> Size (Group 3), Quality (Group 2)
INSERT INTO product_customizations (product_id, group_id, display_order) VALUES
('c1c2c3d4-0002-4000-8000-000000000002', 'a1b2c3d4-3333-4000-8000-000000000003', 1),
('c1c2c3d4-0002-4000-8000-000000000002', 'a1b2c3d4-2222-4000-8000-000000000002', 2);

-- ============================================
-- PRODUCTS - SNACKS & BISCUITS (UUIDs)
-- ============================================

INSERT INTO products (id, name, description, base_price, category, image_urls, is_active, sku, stock_quantity, rating, origin, format, tags, flavor_profile) VALUES
('c1c2c3d4-0013-4000-8000-000000000013', 'Osmania Biscuits', 'Traditional Osmania biscuits - crispy and delicious.', 5.00, '["Biscuits"]', '{"/2026/product/Osmania+Biscuits.png"}', TRUE, 'BSC-OSM-001', 500, 4.6, 'India', 'Pack', 'biscuits,snacks', 'Crispy, Sweet'),
('c1c2c3d4-0014-4000-8000-000000000014', 'Ragi Biscuits', 'Healthy ragi biscuits made with finger millet.', 5.00, '["Biscuits"]', '{"/2026/product/Ragi+Biscuits.png"}', TRUE, 'BSC-RAG-001', 500, 4.5, 'India', 'Pack', 'biscuits,snacks,healthy', 'Nutty, Wholesome'),
('c1c2c3d4-0015-4000-8000-000000000015', 'Cashew Biscuits', 'Premium biscuits loaded with cashew nuts.', 5.00, '["Biscuits"]', '{"/2026/product/Cashew+Biscuits.png"}', TRUE, 'BSC-CSH-001', 500, 4.7, 'India', 'Pack', 'biscuits,snacks,cashew', 'Buttery, Nutty'),
('c1c2c3d4-0016-4000-8000-000000000016', 'Cashew Rusk', 'Crunchy rusk with cashew pieces.', 6.00, '["Biscuits"]', '{"/2026/product/Cashew+Rusk.png"}', TRUE, 'RSK-CSH-001', 500, 4.5, 'India', 'Pack', 'rusk,snacks', 'Crunchy, Nutty'),
('c1c2c3d4-0017-4000-8000-000000000017', 'Ooty Varki', 'Famous Ooty style layered biscuit.', 7.00, '["Biscuits"]', '{"/2026/product/Ooty+Varki.png"}', TRUE, 'BSC-OOT-001', 300, 4.8, 'Ooty, India', 'Pack', 'biscuits,snacks', 'Flaky, Buttery'),
('c1c2c3d4-0018-4000-8000-000000000018', 'Tea Cake', 'Classic tea cake - soft and moist.', 15.00, '["Cakes"]', '{"/2026/product/Tea+Cake.png"}', TRUE, 'CAK-TEA-001', 200, 4.5, 'India', 'Piece', 'cake,sweet', 'Soft, Sweet'),
('c1c2c3d4-0019-4000-8000-000000000019', 'Banana Cake', 'Moist banana cake made with fresh bananas.', 23.00, '["Cakes"]', '{"/2026/product/Banana+Cake.png"}', TRUE, 'CAK-BAN-001', 150, 4.7, 'India', 'Piece', 'cake,sweet', 'Fruity, Moist'),
('c1c2c3d4-0020-4000-8000-000000000020', 'Cashew Pudding', 'Creamy pudding topped with roasted cashews.', 20.00, '["Cakes", "Dessert"]', '{"/2026/product/Cashew+Pudding.png"}', TRUE, 'DES-CPD-001', 100, 4.6, 'India', 'Cup', 'dessert,sweet', 'Creamy, Nutty'),
('c1c2c3d4-0021-4000-8000-000000000021', 'Jam Bun', 'Soft bun filled with sweet fruit jam.', 23.00, '["Cakes", "Bun"]', '{"/2026/product/Jam+Bun.png"}', TRUE, 'BUN-JAM-001', 200, 4.4, 'India', 'Piece', 'bun,sweet', 'Sweet, Fruity'),
('c1c2c3d4-0022-4000-8000-000000000022', 'Cream Bun', 'Fluffy bun filled with fresh cream.', 23.00, '["Cakes", "Bun"]', '{"/2026/product/Cream+Bun.png"}', TRUE, 'BUN-CRM-001', 200, 4.5, 'India', 'Piece', 'bun,sweet', 'Creamy, Light'),
('c1c2c3d4-0023-4000-8000-000000000023', 'Butter Bun', 'Soft bun generously topped with butter.', 23.00, '["Cakes", "Bun"]', '{"/2026/product/butter-bun.png"}', TRUE, 'BUN-BTR-001', 200, 4.4, 'India', 'Piece', 'bun,butter', 'Buttery, Soft'),
('c1c2c3d4-0024-4000-8000-000000000024', 'Masala Peanut', 'Crunchy peanuts coated with spicy masala.', 10.00, '["Snacks", "Savory"]', '{"/2026/product/masala-peanut.png"}', TRUE, 'SNK-MPN-001', 300, 4.5, 'India', 'Pack', 'snacks,savory', 'Spicy, Crunchy'),
('c1c2c3d4-0025-4000-8000-000000000025', 'Butter Murku', 'Traditional South Indian murukku.', 10.00, '["Snacks", "Savory"]', '{"/2026/product/butter-murku.png"}', TRUE, 'SNK-BMK-001', 300, 4.6, 'India', 'Pack', 'snacks,savory', 'Buttery, Crispy'),
('c1c2c3d4-0026-4000-8000-000000000026', 'Moong Dal', 'Crispy fried moong dal.', 10.00, '["Snacks", "Savory"]', '{"/2026/product/moong-dal.png"}', TRUE, 'SNK-MDL-001', 300, 4.4, 'India', 'Pack', 'snacks,savory', 'Salty, Crunchy'),
('c1c2c3d4-0027-4000-8000-000000000027', 'Madras Mixture', 'Classic South Indian mixture.', 10.00, '["Snacks", "Savory"]', '{"/2026/product/Madras-mixture.png"}', TRUE, 'SNK-MMX-001', 300, 4.7, 'India', 'Pack', 'snacks,savory', 'Spicy, Mixed'),
('c1c2c3d4-0028-4000-8000-000000000028', 'Onion Samosa', 'Crispy samosa filled with spiced onion.', 13.00, '["Snacks", "Hot Snacks"]', '{"/2026/product/onion-samosa.png"}', TRUE, 'SNK-OSM-001', 150, 4.5, 'India', 'Piece', 'snacks,savory', 'Spicy, Crispy'),
('c1c2c3d4-0029-4000-8000-000000000029', 'Potato Samosa', 'Classic potato-filled samosa.', 16.00, '["Snacks", "Hot Snacks"]', '{"/2026/product/potato-samosa.png"}', TRUE, 'SNK-PSM-001', 150, 4.6, 'India', 'Piece', 'snacks,savory', 'Spicy, Savory'),
('c1c2c3d4-0030-4000-8000-000000000030', 'Masala Bread', 'Toasted bread with spicy masala.', 20.00, '["Snacks", "Hot Snacks"]', '{"/2026/product/masala-bread.png"}', TRUE, 'SNK-MBD-001', 100, 4.3, 'India', 'Piece', 'snacks,savory', 'Spicy, Toasted'),
('c1c2c3d4-0031-4000-8000-000000000031', 'Egg Puff', 'Flaky puff pastry filled with egg.', 25.00, '["Snacks", "Hot Snacks"]', '{"/2026/product/egg-puff.png"}', TRUE, 'SNK-EPF-001', 100, 4.5, 'India', 'Piece', 'snacks,savory', 'Flaky, Savory'),
('c1c2c3d4-0032-4000-8000-000000000032', 'Veg Puff', 'Flaky puff pastry with veg filling.', 20.00, '["Snacks", "Hot Snacks"]', '{"/2026/product/veg-puff.png"}', TRUE, 'SNK-VPF-001', 120, 4.4, 'India', 'Piece', 'snacks,savory', 'Flaky, Savory');
