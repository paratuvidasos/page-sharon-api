import { OrderNotFoundException } from "../../domain/exceptions/OrderNotFoundException";
import { OrderRepository } from "../../domain/repositories/OrderRepository";
import { buildOrderSummary, OrderSummary } from "../order-summary";
import { canAccessOrder } from "../order-access";
import { CustomerContactPort } from "../ports/CustomerContactPort";

export interface GetOrderByNumberInput {
  orderNumber: string;
  authUserId: string | null;
  guestEmail: string | null;
}

/**
 * [0037] + [0039]: el pedido para la pantalla de resumen y de confirmación.
 *
 * Es también lo que consulta la página de retorno de la pasarela: los
 * parámetros que Bold agrega a la URL (`bold-tx-status`) vienen del navegador
 * y sirven de pista para la interfaz, pero el estado real del pedido es el
 * que responde este endpoint.
 */
export class GetOrderByNumber {
  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly customerContactPort: CustomerContactPort,
  ) {}

  async execute(input: GetOrderByNumberInput): Promise<OrderSummary> {
    const order = await this.orderRepository.findByOrderNumber(input.orderNumber);
    if (!order) {
      throw new OrderNotFoundException();
    }

    // Con sesión iniciada, el correo de la cuenta también sirve como prueba
    // de propiedad: un pedido que la persona hizo como invitado con su propio
    // correo es suyo, y tras iniciar sesión debe poder abrirlo sin tener que
    // volver a escribirlo.
    const provedEmail = input.authUserId
      ? (await this.customerContactPort.execute({ userId: input.authUserId })).email
      : input.guestEmail;

    if (!canAccessOrder(order.userId, order.guestEmail, input.authUserId, provedEmail)) {
      throw new OrderNotFoundException();
    }

    return buildOrderSummary(order);
  }
}
