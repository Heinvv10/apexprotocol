const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'data', 'apexprotocol.db');
const CATALOG = path.join(__dirname, '..', 'muscles-catalog-full.json');
const DEFAULT_MARKUP = 25; // 25% markup

fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

// Remove old DB if re-seeding
if (process.argv.includes('--fresh') && fs.existsSync(DB_PATH)) {
  fs.unlinkSync(DB_PATH);
  console.log('Removed old database');
}

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');

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
    created_at TEXT DEFAULT (datetime('now'))
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
    created_at TEXT DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL,
    price REAL NOT NULL
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
    created_at TEXT DEFAULT (datetime('now'))
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

// Default settings
const upsert = db.prepare('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)');
upsert.run('global_markup_percentage', String(DEFAULT_MARKUP));
upsert.run('supplier_email', '');
upsert.run('supplier_password', '');

// Create admin
const bcrypt = require('bcryptjs');
const adminExists = db.prepare('SELECT id FROM users WHERE is_admin = 1').get();
if (!adminExists) {
  const hash = bcrypt.hashSync('admin123', 10);
  db.prepare('INSERT INTO users (email, password_hash, name, is_admin) VALUES (?, ?, ?, 1)')
    .run('admin@apexprotocol.co.za', hash, 'Admin');
  console.log('Created admin user: admin@apexprotocol.co.za / admin123');
}

// Import products
const catalog = JSON.parse(fs.readFileSync(CATALOG, 'utf8'));

function slugify(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function extractPrice(product) {
  if (product.basePrice !== null && product.basePrice > 0) {
    return product.basePrice;
  }
  // Try description — match R followed by optional nbsp and digits
  const match = (product.desc || '').match(/R[\s\u00a0]*([\d,]+(?:\.\d+)?)/);
  if (match) {
    const val = parseFloat(match[1].replace(',', ''));
    if (!isNaN(val) && val > 10) return val; // Filter out accidental matches like "R3" from "LR3"
  }
  return null;
}

function getSupplierProductId(product) {
  const m = (product.img || '').match(/id=(\d+)/);
  return m ? parseInt(m[1]) : null;
}

function getImageFilename(product) {
  const slug = slugify(product.name);
  const idMatch = (product.img || '').match(/id=(\d+)/);
  const id = idMatch ? idMatch[1] : '';
  const filename = `${slug}-${id}.jpg`;
  const imgPath = path.join(__dirname, 'public', 'images', 'products', filename);
  if (fs.existsSync(imgPath)) return filename;
  const files = fs.readdirSync(path.join(__dirname, 'public', 'images', 'products'));
  const match = files.find(f => f.startsWith(slug));
  return match || filename;
}

function cleanDesc(desc) {
  if (!desc) return '';
  return desc
    .replace(/Sold Out\s*/i, '')
    .replace(/NOTIFY WHEN IN STOCK\s*/i, '')
    .replace(/\nR[\s\u00a0]*[\d,.]+\s*$/, '')
    .trim();
}

const insert = db.prepare(`
  INSERT OR REPLACE INTO products (slug, name, category, description, base_price, sell_price, image, sold_out, supplier_product_id)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

let imported = 0, skipped = 0;
const usedSlugs = new Set();

const tx = db.transaction(() => {
  for (const p of catalog) {
    const basePrice = extractPrice(p);
    if (!basePrice) {
      console.log(`Skipping ${p.name} - no valid price`);
      skipped++;
      continue;
    }

    let slug = slugify(p.name);
    if (usedSlugs.has(slug)) slug = slug + '-' + Math.random().toString(36).slice(2, 6);
    usedSlugs.add(slug);

    const sellPrice = Math.round(basePrice * (1 + DEFAULT_MARKUP / 100));
    const isSoldOut = (p.desc || '').includes('Sold Out') ? 1 : 0;
    const image = getImageFilename(p);
    const desc = cleanDesc(p.desc);
    const supplierId = getSupplierProductId(p);

    try {
      insert.run(slug, p.name, p.category, desc, basePrice, sellPrice, image, isSoldOut, supplierId);
      imported++;
    } catch (e) {
      console.log(`Error importing ${p.name}:`, e.message);
      skipped++;
    }
  }
});

tx();

console.log(`\nDefault markup: ${DEFAULT_MARKUP}%`);
console.log(`Imported: ${imported}, Skipped: ${skipped}`);
console.log(`Database: ${DB_PATH}`);

// Verify
const stats = db.prepare('SELECT COUNT(*) as total, SUM(sold_out) as sold_out, AVG(sell_price/base_price) as avg_ratio FROM products WHERE base_price > 0').get();
console.log(`Stats: ${stats.total} products, ${stats.sold_out} sold out, avg markup ratio ${stats.avg_ratio.toFixed(3)}`);
