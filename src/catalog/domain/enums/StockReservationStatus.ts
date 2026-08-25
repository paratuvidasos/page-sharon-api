/**
 * Ciclo de vida de una reserva de stock.
 *
 * `HELD` ya descontó las unidades de `product_variants`: el stock se aparta
 * al crear la reserva, no al confirmarla. Confirmar (`COMMITTED`) solo cierra
 * la reserva; liberar (`RELEASED`) devuelve las unidades.
 */
export enum StockReservationStatus {
  HELD = "HELD",
  COMMITTED = "COMMITTED",
  RELEASED = "RELEASED",
}
