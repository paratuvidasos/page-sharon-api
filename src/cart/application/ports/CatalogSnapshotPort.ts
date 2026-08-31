import { Locale } from "../../../shared-kernel/domain/enums/Locale";

export interface CartProductSnapshot {
  productId: string;
  variantId: string;
  productName: string;
  variantLabel: string | null;
  thumbnailUrl: string | null;
  unitPrice: number;
  stockQuantity: number;
  isActive: boolean;
}

/**
 * Puerto que `cart` define para lo que necesita de `catalog` (nombre,
 * imagen, precio efectivo, stock y estado activo por variante), sin
 * importar su infraestructura (ver regla 2 del CLAUDE.md del repo). Se
 * implementa en `catalog` como un caso de uso (`GetCartProductSnapshots`)
 * cuyo método `execute` coincide con esta forma — mismo patrón de duck
 * typing que ya usa `RatingSummaryPort` entre `catalog` y `aftersales`.
 */
export interface CatalogSnapshotPort {
  execute(input: { variantIds: string[]; locale?: Locale }): Promise<CartProductSnapshot[]>;
}
