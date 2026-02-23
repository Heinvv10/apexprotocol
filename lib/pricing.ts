import { getDb } from './db';

export async function getGlobalMarkup(): Promise<number> {
  const db = getDb();
  const row = await db.prepare("SELECT value FROM settings WHERE key = 'global_markup_percentage'").get() as any;
  return row ? parseFloat(row.value) : 25;
}

export async function setGlobalMarkup(percentage: number): Promise<void> {
  const db = getDb();
  await db.prepare("INSERT INTO settings (key, value, updated_at) VALUES ('global_markup_percentage', ?, NOW()) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()").run(String(percentage));
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
 */
export async function recalcAllPrices(): Promise<{ updated: number }> {
  const db = getDb();
  const globalMarkup = await getGlobalMarkup();

  const result = await db.prepare(`
    UPDATE products SET sell_price = 
      CASE
        WHEN price_override IS NOT NULL AND price_override > 0 THEN price_override
        WHEN markup_override IS NOT NULL AND markup_override >= 0 THEN ROUND(base_price * (1 + markup_override / 100.0))
        ELSE ROUND(base_price * (1 + ? / 100.0))
      END
    WHERE base_price IS NOT NULL AND base_price > 0
  `).run(globalMarkup);
  return { updated: result.changes };
}

/**
 * Set a price override for a specific product.
 */
export async function setProductPriceOverride(productId: number, priceOverride: number | null): Promise<void> {
  const db = getDb();
  await db.prepare('UPDATE products SET price_override = ? WHERE id = ?').run(priceOverride, productId);
  const globalMarkup = await getGlobalMarkup();
  const p = await db.prepare('SELECT base_price, markup_override FROM products WHERE id = ?').get(productId) as any;
  if (p) {
    const newPrice = calcSellPrice(p.base_price, priceOverride, p.markup_override, globalMarkup);
    await db.prepare('UPDATE products SET sell_price = ? WHERE id = ?').run(newPrice, productId);
  }
}

/**
 * Set a markup override for a specific product.
 */
export async function setProductMarkupOverride(productId: number, markupOverride: number | null): Promise<void> {
  const db = getDb();
  await db.prepare('UPDATE products SET markup_override = ? WHERE id = ?').run(markupOverride, productId);
  const globalMarkup = await getGlobalMarkup();
  const p = await db.prepare('SELECT base_price, price_override FROM products WHERE id = ?').get(productId) as any;
  if (p) {
    const newPrice = calcSellPrice(p.base_price, p.price_override, markupOverride, globalMarkup);
    await db.prepare('UPDATE products SET sell_price = ? WHERE id = ?').run(newPrice, productId);
  }
}

export async function getSetting(key: string): Promise<string> {
  const db = getDb();
  const row = await db.prepare('SELECT value FROM settings WHERE key = ?').get(key) as any;
  return row?.value ?? '';
}

export async function setSetting(key: string, value: string): Promise<void> {
  const db = getDb();
  await db.prepare("INSERT INTO settings (key, value, updated_at) VALUES (?, ?, NOW()) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()").run(key, value);
}
