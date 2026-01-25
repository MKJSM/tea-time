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

-- Sessions Table (Custom Store Support)
CREATE TABLE sessions (
    id TEXT PRIMARY KEY,
    data BLOB NOT NULL,
    expiry_date INTEGER NOT NULL,
    user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    ip_address TEXT,
    user_agent TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Addresses Table
CREATE TABLE addresses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
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
    id INTEGER PRIMARY KEY AUTOINCREMENT,
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
    display_order INTEGER DEFAULT 0,
    color_code TEXT
);

-- Product Customizations (Many-to-Many)
CREATE TABLE product_customizations (
    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
    group_id INTEGER REFERENCES customization_groups(id) ON DELETE CASCADE,
    display_order INTEGER DEFAULT 0,
    PRIMARY KEY (product_id, group_id)
);

-- Favorites Table
CREATE TABLE favorites (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, product_id)
);

-- ============================================
-- PERFORMANCE INDEXES (for 10,000+ products)
-- ============================================

-- Products table indexes
CREATE INDEX idx_products_is_active ON products(is_active);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_category_active ON products(category, is_active);
CREATE INDEX idx_products_name_nocase ON products(name COLLATE NOCASE);

-- Favorites indexes (critical for per-user queries)
CREATE INDEX idx_favorites_user_id ON favorites(user_id);
CREATE INDEX idx_favorites_product_id ON favorites(product_id);

-- Sessions indexes (for cleanup and user lookups)
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_expiry ON sessions(expiry_date);

-- Customization lookup indexes
CREATE INDEX idx_customization_options_group_id ON customization_options(group_id);
CREATE INDEX idx_product_customizations_product_id ON product_customizations(product_id);
CREATE INDEX idx_product_customizations_group_id ON product_customizations(group_id);

-- User lookups by email
CREATE INDEX idx_users_email ON users(email);

-- ============================================
-- FULL-TEXT SEARCH (for fast product search)
-- ============================================
CREATE VIRTUAL TABLE IF NOT EXISTS products_fts USING fts5(
    name,
    description,
    category,
    origin,
    content='products',
    content_rowid='id'
);

-- Triggers to keep FTS index in sync
CREATE TRIGGER products_ai AFTER INSERT ON products BEGIN
    INSERT INTO products_fts(rowid, name, description, category, origin)
    VALUES (new.id, new.name, new.description, new.category, new.origin);
END;

CREATE TRIGGER products_ad AFTER DELETE ON products BEGIN
    INSERT INTO products_fts(products_fts, rowid, name, description, category, origin)
    VALUES ('delete', old.id, old.name, old.description, old.category, old.origin);
END;

CREATE TRIGGER products_au AFTER UPDATE ON products BEGIN
    INSERT INTO products_fts(products_fts, rowid, name, description, category, origin)
    VALUES ('delete', old.id, old.name, old.description, old.category, old.origin);
    INSERT INTO products_fts(rowid, name, description, category, origin)
    VALUES (new.id, new.name, new.description, new.category, new.origin);
END;
