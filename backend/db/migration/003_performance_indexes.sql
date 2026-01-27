-- Enable pg_trgm extension for fast text search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Indexes for search performance
CREATE INDEX IF NOT EXISTS idx_products_name_trgm ON products USING gin(name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_products_origin_trgm ON products USING gin(origin gin_trgm_ops);

-- Missing Foreign Key Indexes
CREATE INDEX IF NOT EXISTS idx_cart_items_cart_id ON cart_items(cart_id);
CREATE INDEX IF NOT EXISTS idx_cart_item_customizations_cart_item_id ON cart_item_customizations(cart_item_id);
CREATE INDEX IF NOT EXISTS idx_carts_user_id ON carts(user_id);
CREATE INDEX IF NOT EXISTS idx_carts_session_id ON carts(session_id);
CREATE INDEX IF NOT EXISTS idx_addresses_user_id ON addresses(user_id);

-- Composite indexes for frequent queries

-- Cart optimizations
CREATE INDEX IF NOT EXISTS idx_carts_user_session ON carts(user_id, session_id);
-- Fast lookup for guest carts
CREATE INDEX IF NOT EXISTS idx_carts_session_null_user ON carts(session_id) WHERE user_id IS NULL;

-- Category optimization
CREATE INDEX IF NOT EXISTS idx_products_category_elements ON products USING gin(category);

-- Order history optimizations
CREATE INDEX IF NOT EXISTS idx_orders_user_status_created ON orders(user_id, status, created_at DESC);
-- Fallback for listing all orders for a user sorted by date
CREATE INDEX IF NOT EXISTS idx_orders_user_created ON orders(user_id, created_at DESC);

-- Address listing optimization
CREATE INDEX IF NOT EXISTS idx_addresses_user_default_created ON addresses(user_id, is_default DESC, created_at DESC);

-- Favorites listing optimization
CREATE INDEX IF NOT EXISTS idx_favorites_user_created ON favorites(user_id, created_at DESC);