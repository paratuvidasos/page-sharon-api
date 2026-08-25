export enum OrderStatus {
  /** Pedido creado, esperando que la pasarela resuelva el cobro. */
  PENDING = "PENDING",
  PAID = "PAID",
  /** [0040]: la pasarela rechazó el cobro. El pedido sigue existiendo para poder reintentar. */
  PAYMENT_FAILED = "PAYMENT_FAILED",
  IN_PREPARATION = "IN_PREPARATION",
  SHIPPED = "SHIPPED",
  DELIVERED = "DELIVERED",
  CANCELLED = "CANCELLED",
  REFUNDED = "REFUNDED",
}

/**
 * Estados en los que un pedido cuenta como compra efectiva. Se usa para
 * exigir compra verificada antes de aceptar una reseña ([0021]) — antes de que
 * existiera el flujo de pago esto era "cualquier pedido no cancelado", que
 * ahora incluiría pedidos que nunca se pagaron.
 */
export const PURCHASED_ORDER_STATUSES: readonly OrderStatus[] = [
  OrderStatus.PAID,
  OrderStatus.IN_PREPARATION,
  OrderStatus.SHIPPED,
  OrderStatus.DELIVERED,
];
