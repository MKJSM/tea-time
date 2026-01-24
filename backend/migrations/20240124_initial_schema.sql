-- Users Table
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'customer',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Addresses Table
CREATE TABLE addresses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    label TEXT NOT NULL,
    recipient_name TEXT NOT NULL,
    phone_number TEXT NOT NULL,
    street_address TEXT NOT NULL,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    postal_code TEXT NOT NULL,
    latitude REAL,
    longitude REAL,
    is_default BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Products Table
CREATE TABLE products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    base_price REAL NOT NULL,
    category TEXT NOT NULL,
    image_url TEXT, -- Base64 encoded SVGs from the HTML
    is_active BOOLEAN DEFAULT 1,
    sku TEXT UNIQUE,
    stock_quantity INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Customization Groups
CREATE TABLE customization_groups (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    input_type TEXT NOT NULL,
    min_selections INTEGER DEFAULT 0,
    max_selections INTEGER,
    is_required BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Customization Options
CREATE TABLE customization_options (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    group_id INTEGER REFERENCES customization_groups(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    price_modifier REAL DEFAULT 0.00,
    is_default BOOLEAN DEFAULT 0,
    display_order INTEGER DEFAULT 0
);

-- Product Customizations (Many-to-Many)
CREATE TABLE product_customizations (
    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
    group_id INTEGER REFERENCES customization_groups(id) ON DELETE CASCADE,
    display_order INTEGER DEFAULT 0,
    PRIMARY KEY (product_id, group_id)
);

-- Seed Data
INSERT INTO products (name, description, base_price, category, image_url, stock_quantity, sku) VALUES
('Hot Masala Tea', 'Aromatic blend of premium tea leaves with traditional Indian spices', 45.0, 'Tea', 'data:image/svg+xml,%3Csvg xmlns=''http://www.w3.org/2000/svg'' viewBox=''0 0 200 200''%3E%3Cdefs%3E%3ClinearGradient id=''cup'' x1=''0%25'' y1=''0%25'' x2=''0%25'' y2=''100%25''%3E%3Cstop offset=''0%25'' style=''stop-color:%23F4A460''/%3E%3Cstop offset=''100%25'' style=''stop-color:%23D2691E''/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect x=''60'' y=''80'' width=''80'' height=''90'' rx=''5'' fill=''url(%23cup)''/%3E%3Cellipse cx=''100'' cy=''80'' rx=''40'' ry=''10'' fill=''%23D2691E''/%3E%3Cellipse cx=''100'' cy=''80'' rx=''35'' ry=''8'' fill=''%23CD853F''/%3E%3Cpath d=''M 140 100 Q 160 100 160 120 Q 160 140 140 140'' stroke=''%23D2691E'' stroke-width=''4'' fill=''none''/%3E%3Ctext x=''100'' y=''130'' text-anchor=''middle'' fill=''white'' font-family=''Arial'' font-size=''24'' font-weight=''bold''%3ESIP%3C/text%3E%3Ctext x=''100'' y=''150'' text-anchor=''middle'' fill=''white'' font-family=''Arial'' font-size=''16''%3ETIME%3C/text%3E%3C/svg%3E', 100, 'TEA-001'),
('Strong Filter Coffee', 'South Indian style filter coffee with rich aroma and bold flavor', 60.0, 'Coffee', 'data:image/svg+xml,%3Csvg xmlns=''http://www.w3.org/2000/svg'' viewBox=''0 0 200 200''%3E%3Cdefs%3E%3ClinearGradient id=''coffee'' x1=''0%25'' y1=''0%25'' x2=''0%25'' y2=''100%25''%3E%3Cstop offset=''0%25'' style=''stop-color:%238B4513''/%3E%3Cstop offset=''100%25'' style=''stop-color:%23654321''/%3E%3C/linearGradient%3E%3C/defs%3E%3Cellipse cx=''100'' cy=''150'' rx=''50'' ry=''8'' fill=''%23654321'' opacity=''0.3''/%3E%3Crect x=''65'' y=''90'' width=''70'' height=''60'' rx=''8'' fill=''url(%23coffee)''/%3E%3Cellipse cx=''100'' cy=''90'' rx=''35'' ry=''8'' fill=''%23654321''/%3E%3Cellipse cx=''100'' cy=''90'' rx=''30'' ry=''6'' fill=''%236F4E37''/%3E%3Cpath d=''M 135 110 Q 155 110 155 130 Q 155 150 135 150'' stroke=''%23654321'' stroke-width=''4'' fill=''none''/%3E%3Ctext x=''100'' y=''125'' text-anchor=''middle'' fill=''white'' font-family=''Arial'' font-size=''20'' font-weight=''bold''%3ESIP%3C/text%3E%3Ctext x=''100'' y=''140'' text-anchor=''middle'' fill=''white'' font-family=''Arial'' font-size=''14''%3ETIME%3C/text%3E%3C/svg%3E', 100, 'COF-001'),
('Plain Tea', 'Classic Plain Tea with perfect blend of tea leaves and milk', 35.0, 'Tea', 'data:image/svg+xml,%3Csvg xmlns=''http://www.w3.org/2000/svg'' viewBox=''0 0 200 200''%3E%3Cdefs%3E%3ClinearGradient id=''plaintea'' x1=''0%25'' y1=''0%25'' x2=''0%25'' y2=''100%25''%3E%3Cstop offset=''0%25'' style=''stop-color:%23DAA520''/%3E%3Cstop offset=''100%25'' style=''stop-color:%23B8860B''/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect x=''60'' y=''80'' width=''80'' height=''90'' rx=''5'' fill=''url(%23plaintea)''/%3E%3Cellipse cx=''100'' cy=''80'' rx=''40'' ry=''10'' fill=''%23B8860B''/%3E%3Cellipse cx=''100'' cy=''80'' rx=''35'' ry=''8'' fill=''%23DAA520''/%3E%3Cpath d=''M 140 100 Q 160 100 160 120 Q 160 140 140 140'' stroke=''%23B8860B'' stroke-width=''4'' fill=''none''/%3E%3Ctext x=''100'' y=''130'' text-anchor=''middle'' fill=''white'' font-family=''Arial'' font-size=''24'' font-weight=''bold''%3ESIP%3C/text%3E%3Ctext x=''100'' y=''150'' text-anchor=''middle'' fill=''white'' font-family=''Arial'' font-size=''16''%3ETIME%3C/text%3E%3C/svg%3E', 100, 'TEA-002'),
('Rose Milk', 'Refreshing rose-flavored milk with a delicate floral aroma', 50.0, 'Milk', 'data:image/svg+xml,%3Csvg xmlns=''http://www.w3.org/2000/svg'' viewBox=''0 0 200 200''%3E%3Cdefs%3E%3ClinearGradient id=''rose'' x1=''0%25'' y1=''0%25'' x2=''0%25'' y2=''100%25''%3E%3Cstop offset=''0%25'' style=''stop-color:%23FFB6C1''/%3E%3Cstop offset=''100%25'' style=''stop-color:%23FF69B4''/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect x=''70'' y=''60'' width=''60'' height=''100'' rx=''30'' fill=''url(%23rose)''/%3E%3Cellipse cx=''100'' cy=''60'' rx=''30'' ry=''10'' fill=''%23FF69B4''/%3E%3Cellipse cx=''100'' cy=''60'' rx=''25'' ry=''7'' fill=''%23FFB6C1''/%3E%3Ctext x=''100'' y=''115'' text-anchor=''middle'' fill=''white'' font-family=''Arial'' font-size=''20'' font-weight=''bold''%3ESIP%3C/text%3E%3Ctext x=''100'' y=''135'' text-anchor=''middle'' fill=''white'' font-family=''Arial'' font-size=''14''%3ETIME%3C/text%3E%3C/svg%3E', 100, 'MILK-001'),
('Strawberry Thick Shake', 'A cool & creamy summer delight with fresh strawberry flavor', 80.0, 'Shake', 'data:image/svg+xml,%3Csvg xmlns=''http://www.w3.org/2000/svg'' viewBox=''0 0 200 200''%3E%3Cdefs%3E%3ClinearGradient id=''strawberry'' x1=''0%25'' y1=''0%25'' x2=''0%25'' y2=''100%25''%3E%3Cstop offset=''0%25'' style=''stop-color:%23FFE4E1''/%3E%3Cstop offset=''100%25'' style=''stop-color:%23FF6B9D''/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect x=''70'' y=''70'' width=''60'' height=''90'' rx=''8'' fill=''url(%23strawberry)''/%3E%3Cellipse cx=''100'' cy=''70'' rx=''30'' ry=''8'' fill=''%23FF6B9D''/%3E%3Cellipse cx=''100'' cy=''70'' rx=''25'' ry=''6'' fill=''%23FFC0CB''/%3E%3Crect x=''95'' y=''50'' width=''10'' height=''25'' fill=''%23228B22''/%3E%3Ctext x=''100'' y=''120'' text-anchor=''middle'' fill=''white'' font-family=''Arial'' font-size=''20'' font-weight=''bold''%3ESIP%3C/text%3E%3Ctext x=''100'' y=''140'' text-anchor=''middle'' fill=''white'' font-family=''Arial'' font-size=''14''%3ETIME%3C/text%3E%3C/svg%3E', 100, 'SHK-001'),
('Palm Fruit Thick Shake', 'A cool & creamy summer delight with natural palm fruit', 85.0, 'Shake', 'data:image/svg+xml,%3Csvg xmlns=''http://www.w3.org/2000/svg'' viewBox=''0 0 200 200''%3E%3Cdefs%3E%3ClinearGradient id=''palm'' x1=''0%25'' y1=''0%25'' x2=''0%25'' y2=''100%25''%3E%3Cstop offset=''0%25'' style=''stop-color:%23FFFACD''/%3E%3Cstop offset=''100%25'' style=''stop-color:%23FFD700''/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect x=''70'' y=''70'' width=''60'' height=''90'' rx=''8'' fill=''url(%23palm)''/%3E%3Cellipse cx=''100'' cy=''70'' rx=''30'' ry=''8'' fill=''%23FFD700''/%3E%3Cellipse cx=''100'' cy=''70'' rx=''25'' ry=''6'' fill=''%23FFFACD''/%3E%3Crect x=''95'' y=''50'' width=''10'' height=''25'' fill=''%23228B22''/%3E%3Ctext x=''100'' y=''120'' text-anchor=''middle'' fill=''%23B8860B'' font-family=''Arial'' font-size=''20'' font-weight=''bold''%3ESIP%3C/text%3E%3Ctext x=''100'' y=''140'' text-anchor=''middle'' fill=''%23B8860B'' font-family=''Arial'' font-size=''14''%3ETIME%3C/text%3E%3C/svg%3E', 100, 'SHK-002');

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