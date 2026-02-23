#!/usr/bin/env node
/**
 * Migrate Apex Protocol from SQLite to Neon PostgreSQL
 */

const { Client } = require('pg');
const Database = require('better-sqlite3');
const fs = require('fs');

const NEON_URL = 'postgresql://neondb_owner:npg_ohf0WcXYymk2@ep-cold-firefly-ajeq5xuy-pooler.c-3.us-east-2.aws.neon.tech/neondb?sslmode=require';
const SQLITE_PATH = './data/apexprotocol.db';

async function main() {
  console.log('🚀 Starting migration to Neon PostgreSQL...\n');

  // Connect to Neon
  const pg = new Client({ connectionString: NEON_URL });
  await pg.connect();
  console.log('✅ Connected to Neon');

  // Connect to SQLite
  const sqlite = new Database(SQLITE_PATH, { readonly: true });
  console.log('✅ Connected to SQLite\n');

  try {
    // Apply schema
    console.log('📋 Creating tables...');
    const schema = fs.readFileSync('./migrate-to-neon.sql', 'utf8');
    await pg.query(schema);
    console.log('✅ Tables created\n');

    // Migrate products
    console.log('📦 Migrating products...');
    const products = sqlite.prepare('SELECT * FROM products').all();
    for (const p of products) {
      await pg.query(`
        INSERT INTO products (id, slug, name, category, description, base_price, sell_price, image, sold_out, created_at, supplier_product_id, price_override, markup_override)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        ON CONFLICT (slug) DO UPDATE SET
          name = EXCLUDED.name,
          base_price = EXCLUDED.base_price,
          sell_price = EXCLUDED.sell_price
      `, [p.id, p.slug, p.name, p.category, p.description, p.base_price, p.sell_price, p.image, p.sold_out, p.created_at, p.supplier_product_id, p.price_override, p.markup_override]);
    }
    console.log(`✅ Migrated ${products.length} products\n`);

    // Migrate users
    console.log('👤 Migrating users...');
    const users = sqlite.prepare('SELECT * FROM users').all();
    for (const u of users) {
      await pg.query(`
        INSERT INTO users (id, email, password_hash, name, phone, is_admin, created_at, subscribed)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (email) DO UPDATE SET
          name = EXCLUDED.name,
          phone = EXCLUDED.phone
      `, [u.id, u.email, u.password_hash, u.name, u.phone, u.is_admin, u.created_at, u.subscribed]);
    }
    console.log(`✅ Migrated ${users.length} users\n`);

    // Migrate orders
    console.log('📋 Migrating orders...');
    const orders = sqlite.prepare('SELECT * FROM orders').all();
    for (const o of orders) {
      await pg.query(`
        INSERT INTO orders (id, ref, user_id, guest_email, guest_name, address_line1, address_line2, city, province, postal_code, shipping_method, shipping_cost, subtotal, total, status, notes, created_at, guest_phone, special_instructions, quote_action, agreed_terms, supplier_sync_status, supplier_order_id, supplier_synced_at, supplier_sync_error, tracking_number, supplier_status)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27)
        ON CONFLICT (ref) DO UPDATE SET
          status = EXCLUDED.status,
          supplier_sync_status = EXCLUDED.supplier_sync_status,
          supplier_order_id = EXCLUDED.supplier_order_id,
          supplier_status = EXCLUDED.supplier_status
      `, [o.id, o.ref, o.user_id, o.guest_email, o.guest_name, o.address_line1, o.address_line2, o.city, o.province, o.postal_code, o.shipping_method, o.shipping_cost, o.subtotal, o.total, o.status, o.notes, o.created_at, o.guest_phone, o.special_instructions, o.quote_action, o.agreed_terms, o.supplier_sync_status, o.supplier_order_id, o.supplier_synced_at, o.supplier_sync_error, o.tracking_number, o.supplier_status]);
    }
    console.log(`✅ Migrated ${orders.length} orders\n`);

    // Migrate order items
    console.log('🛒 Migrating order items...');
    const orderItems = sqlite.prepare('SELECT * FROM order_items').all();
    for (const oi of orderItems) {
      await pg.query(`
        INSERT INTO order_items (id, order_id, product_id, quantity, price)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT DO NOTHING
      `, [oi.id, oi.order_id, oi.product_id, oi.quantity, oi.price]);
    }
    console.log(`✅ Migrated ${orderItems.length} order items\n`);

    // Update sequences
    console.log('🔢 Updating sequences...');
    const maxProductId = sqlite.prepare('SELECT MAX(id) as max FROM products').get().max || 0;
    const maxOrderId = sqlite.prepare('SELECT MAX(id) as max FROM orders').get().max || 0;
    const maxUserId = sqlite.prepare('SELECT MAX(id) as max FROM users').get().max || 0;
    
    await pg.query(`SELECT setval('products_id_seq', $1, true)`, [maxProductId]);
    await pg.query(`SELECT setval('orders_id_seq', $1, true)`, [maxOrderId]);
    await pg.query(`SELECT setval('users_id_seq', $1, true)`, [maxUserId]);
    console.log('✅ Sequences updated\n');

    console.log('🎉 Migration complete!');
    console.log('\nNext steps:');
    console.log('1. Update lib/db.ts to use PostgreSQL');
    console.log('2. Deploy to Vercel');
    console.log('3. Set DATABASE_URL in Vercel environment variables');

  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    throw err;
  } finally {
    await pg.end();
    sqlite.close();
  }
}

main().catch(console.error);
