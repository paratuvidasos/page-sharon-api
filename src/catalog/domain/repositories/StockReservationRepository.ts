export interface StockReservationLine {
  productId: string;
  variantId: string;
  quantity: number;
}

/**
 * Puerto de escritura de las reservas de stock.
 *
 * El stock es de `catalog`, así que apartarlo también lo es: `orders` pide
 * una reserva a través de un caso de uso y nunca toca `product_variants`
 * (reglas 2 y 4 del CLAUDE.md del repo).
 *
 * Todos los métodos son atómicos por diseño. Sin eso, dos compradores
 * llevándose la última unidad al mismo tiempo pasarían ambos la validación
 * previa y uno terminaría pagando algo que no existe.
 */
export interface StockReservationRepository {
  /**
   * Descuenta el stock y registra las reservas en una sola transacción. Si
   * alguna variante no alcanza, no se aparta ninguna: un pedido a medias es
   * peor que uno rechazado.
   *
   * @throws VariantOutOfStockException con las variantes que no alcanzaron.
   */
  hold(referenceId: string, lines: StockReservationLine[], expiresAt: Date): Promise<void>;

  /** Cierra las reservas de una referencia: el stock ya estaba descontado. */
  commit(referenceId: string): Promise<void>;

  /** Devuelve el stock apartado por una referencia. Es idempotente. */
  release(referenceId: string): Promise<void>;

  /**
   * Libera las reservas vencidas y devuelve cuántas liberó. Es lo que impide
   * que un carrito abandonado en la pasarela congele stock para siempre.
   */
  releaseExpired(now: Date): Promise<number>;
}
