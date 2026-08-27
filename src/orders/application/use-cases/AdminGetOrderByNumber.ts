import { OrderNotFoundException } from "../../domain/exceptions/OrderNotFoundException";
import { OrderRepository } from "../../domain/repositories/OrderRepository";
import { buildOrderSummary, OrderSummary } from "../order-summary";

/**
 * [0060]: detalle de un pedido para el panel administrativo — mismo DTO que
 * `GetOrderByNumber` pero sin el chequeo de ownership (el admin puede ver
 * cualquier pedido, no solo el suyo). Se mantiene como caso de uso aparte
 * en vez de relajar `GetOrderByNumber` para no debilitar el guard de
 * propiedad que protege al cliente.
 */
export class AdminGetOrderByNumber {
  constructor(private readonly orderRepository: OrderRepository) {}

  async execute(input: { orderNumber: string }): Promise<OrderSummary> {
    const order = await this.orderRepository.findByOrderNumber(input.orderNumber);
    if (!order) {
      throw new OrderNotFoundException();
    }
    return buildOrderSummary(order);
  }
}
