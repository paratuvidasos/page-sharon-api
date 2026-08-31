export interface ReservationLine {
  productId: string;
  variantId: string;
  quantity: number;
}

/**
 * [0038]: `orders` aparta stock a través de `catalog`, que es su dueño, sin
 * tocar `product_variants` directamente (reglas 2 y 4 del CLAUDE.md del
 * repo). Lo implementan `ReserveStock`, `CommitStockReservation` y
 * `ReleaseStockReservation`.
 */
export interface ReserveStockPort {
  execute(input: { referenceId: string; lines: ReservationLine[]; expiresAt: Date }): Promise<void>;
}

export interface ResolveStockReservationPort {
  execute(input: { referenceId: string }): Promise<void>;
}
