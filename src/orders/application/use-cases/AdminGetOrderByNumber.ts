import { OrderNotFoundException } from "../../domain/exceptions/OrderNotFoundException";
import { OrderRepository } from "../../domain/repositories/OrderRepository";
import { buildOrderSummary } from "../order-summary";
import { fetchRealTimeTracking, OrderDetail } from "../order-detail";
import { ShipmentTrackingPort } from "../ports/ShipmentTrackingPort";

/**
 * [0060]: detalle de un pedido para el panel administrativo — mismo DTO que
 * `GetOrderByNumber` pero sin el chequeo de ownership (el admin puede ver
 * cualquier pedido, no solo el suyo). Se mantiene como caso de uso aparte
 * en vez de relajar `GetOrderByNumber` para no debilitar el guard de
 * propiedad que protege al cliente.
 *
 * Incluye `realTimeTracking` con la misma forma que ya tiene el endpoint del
 * cliente: sin esto, soporte/operaciones no tenía forma de ver si Track123
 * ya escaneó el envío sin abrirle el pedido al cliente.
 */
export class AdminGetOrderByNumber {
  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly shipmentTrackingPort: ShipmentTrackingPort,
  ) {}

  async execute(input: { orderNumber: string }): Promise<OrderDetail> {
    const order = await this.orderRepository.findByOrderNumber(input.orderNumber);
    if (!order) {
      throw new OrderNotFoundException();
    }

    const summary = buildOrderSummary(order);
    return { ...summary, realTimeTracking: await fetchRealTimeTracking(summary, this.shipmentTrackingPort) };
  }
}
