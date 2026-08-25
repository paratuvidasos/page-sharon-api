export interface VariantParcelSnapshot {
  productId: string;
  variantId: string;
  weightGrams: number;
  lengthCm: number | null;
  widthCm: number | null;
  heightCm: number | null;
}

/**
 * [0048]: `shipping` le pide a `catalog` las medidas de las variantes que se
 * van a enviar. Lo implementa `catalog` con `GetCartProductSnapshots`, por
 * duck typing — el mismo patrón que ya usan `RatingSummaryPort` y los puertos
 * de `cart` y `orders` (regla 2 del CLAUDE.md del repo).
 *
 * Las medidas se leen del catálogo y nunca del cuerpo de la petición: si el
 * cliente pudiera declarar el peso, podría declarar cero y pagar el envío más
 * barato.
 */
export interface ProductParcelPort {
  execute(input: { variantIds: string[] }): Promise<VariantParcelSnapshot[]>;
}
