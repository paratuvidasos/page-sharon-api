import { DomainEvent } from "./DomainEvent";

/**
 * [0047] + [0044]: publicado por `orders` cada vez que un pedido avanza en su
 * cumplimiento (preparación, envío, entrega).
 *
 * Lleva el destinatario y los datos del envío **dentro del evento** en vez de
 * solo el `orderId`: así el módulo que notifica no tiene que consultar a
 * `orders` ni a `accounts` para armar el mensaje (regla 3 del CLAUDE.md del
 * repo). Un pedido de invitado no tiene `userId`, y por eso viaja también el
 * correo: es la única forma de avisarle a quien compró sin cuenta.
 */
export class OrderStatusChanged implements DomainEvent {
  static readonly eventName = "orders.order_status_changed";
  readonly eventName = OrderStatusChanged.eventName;
  readonly occurredAt: Date;

  constructor(
    public readonly orderId: string,
    public readonly orderNumber: string,
    public readonly previousStatus: string,
    public readonly status: string,
    public readonly userId: string | null,
    public readonly recipientEmail: string | null,
    public readonly carrierName: string | null,
    public readonly trackingNumber: string | null,
    public readonly trackingUrl: string | null,
  ) {
    this.occurredAt = new Date();
  }
}
