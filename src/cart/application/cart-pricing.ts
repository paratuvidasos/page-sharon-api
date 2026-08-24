import { Coupon } from "../domain/entities/Coupon";

export interface CartPricingItem {
  quantity: number;
  unitPrice: number;
}

export interface CartTotals {
  subtotal: number;
  discount: number;
  total: number;
}

/**
 * Cálculo puro compartido por `GetCart` y `ApplyCouponToCart` para que el
 * subtotal/descuento se calculen exactamente igual en ambos lugares.
 */
export function computeCartTotals(items: CartPricingItem[], coupon: Coupon | null): CartTotals {
  const subtotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const discount = coupon ? coupon.discountAmount(subtotal) : 0;
  return { subtotal, discount, total: subtotal - discount };
}
