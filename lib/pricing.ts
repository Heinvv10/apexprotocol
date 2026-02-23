import { getDb } from './db';

export function getGlobalMarkup(): number {
  const db = getDb();
  const row = db.prepare("SELECT value FROM settings WHERE key = 'global_markup_percentage'").get() as any;
  return row ? parseFloat(row.value) : 25;
}

export function setGlobalMarkup(percentage: number): void {
  const db = getDb();
  db.prepare("INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES ('global_markup_percentage', ?, datetime('now'))").run(String(percentage));
}

/**
 * Calculate the selling price for a product.
 * Priority: price_override > markup_override > global markup
 */
export function calcSellPrice(basePrice: number, priceOverride: number | null, markupOverride: number | null, globalMarkup: number): number {
  if (priceOverride !== null && priceOverride > 0) return priceOverride;
  const markup = (markupOverride !== null && markupOverride >= 0) ? markupOverride : globalMarkup;
  return Math.round(basePrice * (1 + markup / 100));
}

/**
 * Recalculate ALL product sell_prices based on current pricing rules.
 * Called when global markup changes or on demand.
 */
export function recalcAllPrices(): { updated: number } {
  const db = getDb();
  const globalMarkup = getGlobalMarkup();

  // Products with price_override keep that exact price
  // Products with markup_override use that markup
  // All others use global markup
  const stmt = db.prepare(`
    UPDATE products SET sell_price = 
      CASE
        WHEN price_override IS NOT NULL AND price_override > 0 THEN price_override
        WHEN markup_override IS NOT NULL AND markup_override >= 0 THEN ROUND(base_price * (1 + markup_override / 100.0))
        ELSE ROUND(base_price * (1 + ? / 100.0))
      END
    WHERE base_price IS NOT NULL AND base_price > 0
  `);
  const result = stmt.run(globalMarkup);
  return { updated: result.changes };
}

/**
 * Set a price override for a specific product.
 */
export function setProductPriceOverride(productId: number, priceOverride: number | null): void {
  const db = getDb();
  db.prepare('UPDATE products SET price_override = ? WHERE id = ?').run(priceOverride, productId);
  // Recalc just this product
  const globalMarkup = getGlobalMarkup();
  const p = db.prepare('SELECT base_price, markup_override FROM products WHERE id = ?').get(productId) as any;
  if (p) {
    const newPrice = calcSellPrice(p.base_price, priceOverride, p.markup_override, globalMarkup);
    db.prepare('UPDATE products SET sell_price = ? WHERE id = ?').run(newPrice, productId);
  }
}

/**
 * Set a markup override for a specific product.
 */
export function setProductMarkupOverride(productId: number, markupOverride: number | null): void {
  const db = getDb();
  db.prepare('UPDATE products SET markup_override = ? WHERE id = ?').run(markupOverride, productId);
  const globalMarkup = getGlobalMarkup();
  const p = db.prepare('SELECT base_price, price_override FROM products WHERE id = ?').get(productId) as any;
  if (p) {
    const newPrice = calcSellPrice(p.base_price, p.price_override, markupOverride, globalMarkup);
    db.prepare('UPDATE products SET sell_price = ? WHERE id = ?').run(newPrice, productId);
  }
}

export function getSetting(key: string): string {
  const db = getDb();
  const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key) as any;
  return row?.value ?? '';
}

export function setSetting(key: string, value: string): void {
  const db = getDb();
  db.prepare("INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES (?, ?, datetime('now'))").run(key, value);
}
