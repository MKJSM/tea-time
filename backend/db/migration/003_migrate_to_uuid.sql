-- Migration: Convert all INTEGER IDs to UUID (TEXT)
-- This migration drops all existing data and recreates tables with UUID primary keys

-- Drop existing tables in reverse dependency order
DROP TABLE IF EXISTS cart_item_customizations;
DROP TABLE IF EXISTS cart_items;
DROP TABLE IF EXISTS carts;
DROP TABLE IF EXISTS favorites;
DROP TABLE IF EXISTS product_customizations;
DROP TABLE IF EXISTS customization_options;
DROP TABLE IF EXISTS customization_groups;
DROP TABLE IF EXISTS products_fts;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS addresses;
DROP TABLE IF EXISTS sessions;
DROP TABLE IF EXISTS users;

-- Drop triggers if they exist
DROP TRIGGER IF EXISTS products_ai;
DROP TRIGGER IF EXISTS products_ad;
DROP TRIGGER IF EXISTS products_au;

-- ============================================
-- RECREATE TABLES WITH UUID PRIMARY KEYS
-- ============================================

-- Users Table
CREATE TABLE users (
    id TEXT PRIMARY KEY, -- UUID
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT NOT NULL DEFAULT '',
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'customer',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Sessions Table
CREATE TABLE sessions (
    id TEXT PRIMARY KEY, -- UUID
    data BLOB NOT NULL,
    expiry_date INTEGER NOT NULL,
    user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    ip_address TEXT,
    user_agent TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Addresses Table
CREATE TABLE addresses (
    id TEXT PRIMARY KEY, -- UUID
    user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
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
    id TEXT PRIMARY KEY, -- UUID
    name TEXT NOT NULL,
    description TEXT,
    base_price REAL NOT NULL,
    category TEXT NOT NULL,
    image_url TEXT,
    is_active BOOLEAN DEFAULT 1,
    sku TEXT UNIQUE,
    stock_quantity INTEGER DEFAULT 0,
    rating REAL DEFAULT 0.0,
    origin TEXT,
    caffeine TEXT,
    format TEXT,
    brewing_guide TEXT,
    story TEXT,
    tags TEXT,
    flavor_profile TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Customization Groups
CREATE TABLE customization_groups (
    id TEXT PRIMARY KEY, -- UUID
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
    id TEXT PRIMARY KEY, -- UUID
    group_id TEXT REFERENCES customization_groups(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    price_modifier REAL DEFAULT 0.00,
    is_default BOOLEAN DEFAULT 0,
    display_order INTEGER DEFAULT 0,
    color_code TEXT
);

-- Product Customizations (Many-to-Many)
CREATE TABLE product_customizations (
    product_id TEXT REFERENCES products(id) ON DELETE CASCADE,
    group_id TEXT REFERENCES customization_groups(id) ON DELETE CASCADE,
    display_order INTEGER DEFAULT 0,
    PRIMARY KEY (product_id, group_id)
);

-- Favorites Table
CREATE TABLE favorites (
    id TEXT PRIMARY KEY, -- UUID
    user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    product_id TEXT REFERENCES products(id) ON DELETE CASCADE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, product_id)
);

-- Carts Table
CREATE TABLE carts (
    id TEXT PRIMARY KEY, -- UUID
    user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    session_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Cart Items Table
CREATE TABLE cart_items (
    id TEXT PRIMARY KEY, -- UUID
    cart_id TEXT REFERENCES carts(id) ON DELETE CASCADE,
    product_id TEXT REFERENCES products(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    added_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Cart Item Customizations
CREATE TABLE cart_item_customizations (
    id TEXT PRIMARY KEY, -- UUID
    cart_item_id TEXT REFERENCES cart_items(id) ON DELETE CASCADE,
    group_id TEXT REFERENCES customization_groups(id),
    option_id TEXT REFERENCES customization_options(id),
    price_modifier REAL DEFAULT 0.00
);

-- ============================================
-- PERFORMANCE INDEXES
-- ============================================

CREATE INDEX idx_products_is_active ON products(is_active);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_category_active ON products(category, is_active);
CREATE INDEX idx_products_name_nocase ON products(name COLLATE NOCASE);
CREATE INDEX idx_favorites_user_id ON favorites(user_id);
CREATE INDEX idx_favorites_product_id ON favorites(product_id);
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_expiry ON sessions(expiry_date);
CREATE INDEX idx_customization_options_group_id ON customization_options(group_id);
CREATE INDEX idx_product_customizations_product_id ON product_customizations(product_id);
CREATE INDEX idx_product_customizations_group_id ON product_customizations(group_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_carts_user_id ON carts(user_id);
CREATE INDEX idx_carts_session_id ON carts(session_id);
CREATE INDEX idx_cart_items_cart_id ON cart_items(cart_id);
CREATE INDEX idx_cart_items_product_id ON cart_items(product_id);
