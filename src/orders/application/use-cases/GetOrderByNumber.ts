import { OrderNotFoundException } from "../../domain/exceptions/OrderNotFoundException";
import { OrderRepository } from "../../domain/repositories/OrderRepository";
import { buildOrderSummary, OrderSummary } from "../order-summary";
import { canAccessOrder } from "../order-access";
import { CustomerContactPort } from "../ports/CustomerContactPort";
import { ShipmentTrackingPort, ShipmentTrackingView } from "../ports/ShipmentTrackingPort";

export interface GetOrderByNumberInput {
  orderNumber: string;
  authUserId: string | null;
  guestEmail: string | null;
}

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
    private readonly shipmentTrackingPort: ShipmentTrackingPort,
  ) {}

  async execute(input: GetOrderByNumberInput): Promise<OrderDetail> {
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

    const summary = buildOrderSummary(order);
    return { ...summary, realTimeTracking: await this.fetchRealTimeTracking(summary) };
  }

  /**
   * Sin envío todavía no tiene sentido preguntarle a `shipping`. Con envío,
   * la consulta es best-effort: que Track123 no tenga datos todavía (o que
   * el proveedor esté caído) no puede tumbar el detalle del pedido.
   */
  private async fetchRealTimeTracking(summary: OrderSummary): Promise<ShipmentTrackingView | null> {
    if (!summary.shipment) {
      return null;
    }
    try {
      return await this.shipmentTrackingPort.execute({ orderId: summary.id });
    } catch {
      return null;
    }
  }
}
