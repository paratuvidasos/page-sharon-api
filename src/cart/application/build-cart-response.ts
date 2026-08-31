import { DEFAULT_LOCALE, Locale } from "../../shared-kernel/domain/enums/Locale";
import { Cart } from "../domain/entities/Cart";
import { CouponRepository } from "../domain/repositories/CouponRepository";
import { CatalogSnapshotPort } from "./ports/CatalogSnapshotPort";
import { computeCartTotals } from "./cart-pricing";

export interface CartItemResponse {
  itemId: string;
  productId: string;
  variantId: string;
  productName: string;
  variantLabel: string | null;
  thumbnailUrl: string | null;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  priceChanged: boolean;
  unavailable: boolean;
  availableStock: number;
}

export interface CartResponse {
  items: CartItemResponse[];
  subtotal: number;
  couponCode: string | null;
  discount: number;
  total: number;
  couponInvalid: boolean;
}

export const EMPTY_CART_RESPONSE: CartResponse = {
  items: [],
  subtotal: 0,
  couponCode: null,
  discount: 0,
  total: 0,
  couponInvalid: false,
};

/**
 * Ensambla el DTO de respuesta compartido por `GetCart` y por cada caso de
 * uso de mutación (todas devuelven el carrito completo actualizado, ver
 * "cart.controller.ts" del plan). Junta cada línea con su snapshot vivo de
 * `catalog` (nombre/imagen/precio/stock actuales) para detectar cambios de
 * precio y disponibilidad ([0024]), y re-valida el cupón aplicado, si hay
 * uno, contra su vigencia actual.
 */
export async function buildCartResponse(
  cart: Cart | null,
  catalogSnapshotPort: CatalogSnapshotPort,
  couponRepository: CouponRepository,
  locale: Locale = DEFAULT_LOCALE,
): Promise<{ response: CartResponse; couponWasInvalid: boolean }> {
  if (!cart || cart.items.length === 0) {
    return { response: EMPTY_CART_RESPONSE, couponWasInvalid: false };
  }

  const variantIds = cart.items.map((item) => item.toProps().variantId);
  const snapshots = await catalogSnapshotPort.execute({ variantIds, locale });
  const snapshotByVariantId = new Map(snapshots.map((snapshot) => [snapshot.variantId, snapshot]));

  const items: CartItemResponse[] = cart.items.map((item) => {
    const props = item.toProps();
    const snapshot = snapshotByVariantId.get(props.variantId) ?? null;
    const unitPrice = snapshot?.unitPrice ?? props.priceAtAddition;

    return {
      itemId: props.id,
      productId: props.productId,
      variantId: props.variantId,
      productName: snapshot?.productName ?? "Producto no disponible",
      variantLabel: snapshot?.variantLabel ?? null,
      thumbnailUrl: snapshot?.thumbnailUrl ?? null,
      quantity: props.quantity,
      unitPrice,
      subtotal: unitPrice * props.quantity,
      priceChanged: snapshot != null && snapshot.unitPrice !== props.priceAtAddition,
      unavailable: snapshot == null || !snapshot.isActive || snapshot.stockQuantity <= 0,
      availableStock: snapshot?.stockQuantity ?? 0,
    };
  });

  const coupon = cart.couponCode ? await couponRepository.findByCode(cart.couponCode) : null;
  const { subtotal, discount, total } = computeCartTotals(items, coupon);

  let couponInvalid = false;
  if (cart.couponCode) {
    if (!coupon) {
      couponInvalid = true;
    } else {
      try {
        coupon.assertApplicable(subtotal, new Date());
      } catch {
        couponInvalid = true;
      }
    }
  }

  return {
    response: {
      items,
      subtotal,
      couponCode: cart.couponCode,
      discount: couponInvalid ? 0 : discount,
      total: couponInvalid ? subtotal : total,
      couponInvalid,
    },
    couponWasInvalid: couponInvalid,
  };
}
