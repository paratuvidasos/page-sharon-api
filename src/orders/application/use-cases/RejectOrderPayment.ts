import { OrderStatus } from "../../domain/enums/OrderStatus";
import { OrderRepository } from "../../domain/repositories/OrderRepository";
import { ResolveStockReservationPort } from "../ports/StockReservationPort";

export interface RejectOrderPaymentInput {
  orderId: string;
  reason: string;
}

/**
 * [0040]: el pago fue rechazado.
 *
 * El pedido pasa a PAYMENT_FAILED y se devuelve el stock apartado, pero **el
 * carrito no se toca**: el criterio de aceptación pide poder reintentar sin
 * volver a llenar todo. El pedido tampoco se borra — conserva su número y sus
 * datos para que el reintento sea un paso, no un checkout nuevo.
 *
 * Idempotente: un pedido que ya no está en PENDING se ignora, porque el
 * webhook puede repetirse.
 */
export class RejectOrderPayment {
  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly releaseStockReservationPort: ResolveStockReservationPort,
  ) {}

  async execute(input: RejectOrderPaymentInput): Promise<void> {
    const order = await this.orderRepository.findById(input.orderId);
    if (!order || order.status !== OrderStatus.PENDING) {
      return;
    }

    order.markPaymentFailed(input.reason);
    await this.orderRepository.update(order);
    await this.releaseStockReservationPort.execute({ referenceId: order.id });
  }
}
