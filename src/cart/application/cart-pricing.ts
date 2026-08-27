import { Coupon } from "../domain/entities/Coupon";

export interface CartPricingItem {
  productId: string;
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
 *
 * [0061]: si el cupón restringe por producto, el descuento se calcula solo
 * sobre el subtotal de las líneas que matchean (`appliesToProduct`) — sin
 * esto la restricción de "productos aplicables" sería decorativa. Cuando el
 * cupón aplica a todo el carrito (`applicableProductIds: null`), el subtotal
 * elegible es el subtotal completo y el cálculo queda igual que antes de
 * [0061].
 */
export function computeCartTotals(items: CartPricingItem[], coupon: Coupon | null): CartTotals {
  const subtotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);

  if (!coupon) {
    return { subtotal, discount: 0, total: subtotal };
  }

  const applicableSubtotal = items
    .filter((item) => coupon.appliesToProduct(item.productId))
    .reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);

  const discount = coupon.discountAmount(applicableSubtotal);
  return { subtotal, discount, total: subtotal - discount };
}
