import Database from 'better-sqlite3';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'data', 'apexprotocol.db');

let db: Database.Database;

export function getDb(): Database.Database {
  if (!db) {
    const fs = require('fs');
    fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initSchema(db);
  }
  return db;
}

function initSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      description TEXT,
      base_price REAL,
      sell_price REAL NOT NULL,
      image TEXT,
      sold_out INTEGER DEFAULT 0,
      supplier_product_id INTEGER,
      price_override REAL,
      markup_override REAL,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      phone TEXT,
      is_admin INTEGER DEFAULT 0,
      approved INTEGER DEFAULT 0,
      referral TEXT,
      subscribed INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS addresses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      label TEXT DEFAULT 'Home',
      street TEXT NOT NULL,
      suburb TEXT,
      city TEXT NOT NULL,
      postal_code TEXT NOT NULL,
      province TEXT NOT NULL,
      country TEXT DEFAULT 'South Africa',
      is_default INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ref TEXT UNIQUE NOT NULL,
      user_id INTEGER,
      guest_name TEXT,
      guest_phone TEXT,
      guest_email TEXT,
      address_street TEXT,
      address_suburb TEXT,
      address_city TEXT,
      address_province TEXT,
      address_postal_code TEXT,
      shipping_method TEXT,
      shipping_cost REAL DEFAULT 0,
      subtotal REAL NOT NULL,
      total REAL NOT NULL,
      status TEXT DEFAULT 'Awaiting Payment',
      special_instructions TEXT,
      quote_action TEXT DEFAULT 'create_new',
      agreed_terms INTEGER DEFAULT 0,
      supplier_sync_status TEXT DEFAULT 'pending',
      supplier_order_id TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      quantity INTEGER NOT NULL,
      price REAL NOT NULL,
      FOREIGN KEY (order_id) REFERENCES orders(id),
      FOREIGN KEY (product_id) REFERENCES products(id)
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS stock_notify (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL,
      email TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (product_id) REFERENCES products(id)
    );

    CREATE TABLE IF NOT EXISTS contact_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      email TEXT NOT NULL,
      message TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT DEFAULT (datetime('now'))
    );
  `);

  // Migration-safe column additions
  const safeAdd = (table: string, col: string, type: string) => {
    try { db.exec(`ALTER TABLE ${table} ADD COLUMN ${col} ${type}`); } catch {}
  };
  safeAdd('products', 'supplier_product_id', 'INTEGER');
  safeAdd('products', 'price_override', 'REAL');
  safeAdd('products', 'markup_override', 'REAL');
  safeAdd('orders', 'supplier_sync_status', "TEXT DEFAULT 'pending'");
  safeAdd('orders', 'supplier_order_id', 'TEXT');
  safeAdd('orders', 'guest_phone', 'TEXT');
  safeAdd('orders', 'special_instructions', 'TEXT');
  safeAdd('orders', 'quote_action', "TEXT DEFAULT 'create_new'");
  safeAdd('orders', 'agreed_terms', 'INTEGER DEFAULT 0');
  safeAdd('users', 'subscribed', 'INTEGER DEFAULT 0');
  safeAdd('users', 'approved', 'INTEGER DEFAULT 0');
  safeAdd('users', 'referral', 'TEXT');

  // Default settings
  const upsertSetting = db.prepare('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)');
  upsertSetting.run('global_markup_percentage', '25');
  upsertSetting.run('supplier_email', '');
  upsertSetting.run('supplier_password', '');

  // Create admin user if none exists
  const adminExists = db.prepare('SELECT id FROM users WHERE is_admin = 1').get();
  if (!adminExists) {
    const bcrypt = require('bcryptjs');
    const hash = bcrypt.hashSync('admin123', 10);
    db.prepare('INSERT INTO users (email, password_hash, name, is_admin, approved) VALUES (?, ?, ?, 1, 1)')
      .run('admin@apexprotocol.co.za', hash, 'Admin');
  }
}
