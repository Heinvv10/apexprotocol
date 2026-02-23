-- Apex Protocol - PostgreSQL Schema Migration
-- Target: Neon Database

-- Drop existing tables if needed (careful!)
-- DROP TABLE IF EXISTS order_items, orders, addresses, contact_requests, notifications, stock_notify, products, users, settings CASCADE;

-- Products
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    description TEXT,
    base_price DECIMAL(10,2),
    sell_price DECIMAL(10,2) NOT NULL,
    image TEXT,
    sold_out INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    supplier_product_id INTEGER,
    price_override DECIMAL(10,2),
    markup_override DECIMAL(10,2)
);

-- Users
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    phone TEXT,
    is_admin INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    subscribed INTEGER DEFAULT 0
);

-- Orders
CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    ref TEXT UNIQUE NOT NULL,
    user_id INTEGER REFERENCES users(id),
    guest_email TEXT,
    guest_name TEXT,
    address_line1 TEXT,
    address_line2 TEXT,
    city TEXT,
    province TEXT,
    postal_code TEXT,
    shipping_method TEXT,
    shipping_cost DECIMAL(10,2) DEFAULT 0,
    subtotal DECIMAL(10,2) NOT NULL,
    total DECIMAL(10,2) NOT NULL,
    status TEXT DEFAULT 'Awaiting Payment',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    guest_phone TEXT,
    special_instructions TEXT,
    quote_action TEXT DEFAULT 'create_new',
    agreed_terms INTEGER DEFAULT 0,
    supplier_sync_status TEXT DEFAULT 'pending',
    supplier_order_id TEXT,
    supplier_synced_at TIMESTAMP,
    supplier_sync_error TEXT,
    tracking_number TEXT,
    supplier_status TEXT DEFAULT NULL
);

-- Order Items
CREATE TABLE IF NOT EXISTS order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES products(id),
    quantity INTEGER NOT NULL,
    price DECIMAL(10,2) NOT NULL
);

-- Addresses
CREATE TABLE IF NOT EXISTS addresses (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    label TEXT DEFAULT 'Home',
    street TEXT NOT NULL,
    suburb TEXT,
    city TEXT NOT NULL,
    postal_code TEXT NOT NULL,
    province TEXT NOT NULL,
    country TEXT DEFAULT 'South Africa',
    is_default INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    active INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Stock Notifications
CREATE TABLE IF NOT EXISTS stock_notify (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES products(id),
    email TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Contact Requests
CREATE TABLE IF NOT EXISTS contact_requests (
    id SERIAL PRIMARY KEY,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT NOT NULL,
    message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Settings
CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_orders_ref ON orders(ref);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_supplier_order_id ON orders(supplier_order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
CREATE INDEX IF NOT EXISTS idx_products_supplier_id ON products(supplier_product_id);
