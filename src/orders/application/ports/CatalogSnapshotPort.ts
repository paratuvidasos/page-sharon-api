export interface OrderProductSnapshot {
  productId: string;
  variantId: string;
  productName: string;
  sku: string;
  variantLabel: string | null;
  thumbnailUrl: string | null;
  unitPrice: number;
  stockQuantity: number;
  isActive: boolean;
}

/**
 * Lo que `orders` necesita de `catalog` para revalidar un pedido antes de
 * cobrarlo ([0038]): precio efectivo, stock y estado activo por variante.
 *
 * Se declara acá y no se importa el de `cart` porque cada módulo define el
 * puerto de lo que necesita (regla 2 del CLAUDE.md del repo). Lo implementa
 * `catalog` con `GetCartProductSnapshots`, por duck typing — el mismo patrón
 * que ya usan `RatingSummaryPort` y el puerto equivalente de `cart`.
 */
export interface CatalogSnapshotPort {
  execute(input: { variantIds: string[] }): Promise<OrderProductSnapshot[]>;
}
