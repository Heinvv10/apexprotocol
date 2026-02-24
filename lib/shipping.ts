export type ShippingMethod = 'courier_door' | 'courier_kiosk' | 'postnet' | 'fastway';

export const SHIPPING_METHODS: Record<ShippingMethod, { label: string; cost: number; description: string }> = {
  courier_door: { label: 'Courier to-Door', cost: 180, description: 'Delivered to your door' },
  courier_kiosk: { label: 'Courier to-Kiosk', cost: 180, description: 'Collect from courier kiosk' },
  postnet: { label: 'PostNet', cost: 140, description: 'Collect from PostNet branch' },
  fastway: { label: 'Fastway (Main Cities)', cost: 130, description: 'Main cities only' },
};

export const FREE_SHIPPING_THRESHOLD = 5000;

export function calcShipping(subtotal: number, method: ShippingMethod): number {
  if (subtotal >= FREE_SHIPPING_THRESHOLD) return 0;
  return SHIPPING_METHODS[method]?.cost ?? 180;
}
