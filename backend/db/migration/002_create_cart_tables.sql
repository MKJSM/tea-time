-- Carts Table
CREATE TABLE carts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT REFERENCES users(id) ON DELETE CASCADE, -- UUID
    session_id TEXT, -- For guest identification
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Cart Items Table
CREATE TABLE cart_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cart_id INTEGER REFERENCES carts(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    added_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Cart Item Customizations
CREATE TABLE cart_item_customizations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cart_item_id INTEGER REFERENCES cart_items(id) ON DELETE CASCADE,
    group_id INTEGER REFERENCES customization_groups(id),
    option_id INTEGER REFERENCES customization_options(id),
    price_modifier REAL DEFAULT 0.00
);