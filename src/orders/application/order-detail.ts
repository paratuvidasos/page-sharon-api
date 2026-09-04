import { OrderSummary } from "./order-summary";
import { ShipmentTrackingPort, ShipmentTrackingView } from "./ports/ShipmentTrackingPort";

export interface OrderDetail extends OrderSummary {
  /**
   * Estado real de la transportadora (Track123), aparte del historial de
   * estados que fija el admin. `null` mientras el pedido no se despacha, o
   * si todavía no hay un registro sincronizado — nunca por un error, que
   * degrada igual a `null` en vez de tumbar el resto del detalle del pedido.
   */
  realTimeTracking: ShipmentTrackingView | null;
}

/**
 * Compartido por `GetOrderByNumber` (cliente) y `AdminGetOrderByNumber`
 * (panel administrativo): ambos casos de uso enriquecen el mismo
 * `OrderSummary` con el tracking en tiempo real de la misma forma. Sin
 * envío todavía no tiene sentido preguntarle a `shipping`. Con envío, la
 * consulta es best-effort: que Track123 no tenga datos todavía (o que el
 * proveedor esté caído) no puede tumbar el detalle del pedido.
 */
export async function fetchRealTimeTracking(
  summary: OrderSummary,
  shipmentTrackingPort: ShipmentTrackingPort,
): Promise<ShipmentTrackingView | null> {
  if (!summary.shipment) {
    return null;
  }
  try {
    return await shipmentTrackingPort.execute({ orderId: summary.id });
  } catch {
    return null;
  }
}
