import { DomainEvent } from "./DomainEvent";

/**
 * Publicado por `payments` cuando la pasarela rechaza el cobro ([0040]).
 * `orders` lo escucha para marcar el pedido como PAYMENT_FAILED y liberar la
 * reserva de stock — el carrito no se toca, para que el comprador pueda
 * reintentar sin volver a armarlo.
 *
 * `failureMessage` ya viene traducido a lenguaje de usuario; el código crudo
 * de la pasarela viaja aparte y solo se usa para diagnóstico.
 */
export class PaymentRejected implements DomainEvent {
  static readonly eventName = "payments.payment_rejected";
  readonly eventName = PaymentRejected.eventName;
  readonly occurredAt: Date;

  constructor(
    public readonly orderId: string,
    public readonly referenceId: string,
    public readonly failureCode: string | null,
    public readonly failureMessage: string,
  ) {
    this.occurredAt = new Date();
  }
}
