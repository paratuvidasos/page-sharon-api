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
  /**
   * [0059]/[0060]: una reserva ya `COMMITTED` (pedido pagado) cuyo stock se
   * devolvió porque el pedido se canceló o reembolsó después de pagado.
   * Distinto de `RELEASED`, que es la devolución de una reserva que nunca
   * llegó a pagarse (`HELD` → expiró o se abandonó el checkout) — separarlos
   * deja el historial de reservas legible: "se pagó y después se revirtió" no
   * es lo mismo que "nunca se pagó".
   */
  REVERSED = "REVERSED",
}
