import { Currency } from "../enums/Currency";
import { PaymentMethod } from "../enums/PaymentMethod";
import { DomainEvent } from "./DomainEvent";

/**
 * Publicado por `payments` cuando la pasarela confirma el cobro. `orders` lo
 * escucha para pasar el pedido a PAID, confirmar la reserva de stock, redimir
 * el cupón, vaciar el carrito y disparar el correo de confirmación ([0039]).
 *
 * Es un evento y no una llamada directa porque `payments` no debe conocer el
 * módulo de pedidos (ver regla 3 de arquitectura del CLAUDE.md del repo).
 */
export class PaymentApproved implements DomainEvent {
  static readonly eventName = "payments.payment_approved";
  readonly eventName = PaymentApproved.eventName;
  readonly occurredAt: Date;

  constructor(
    public readonly orderId: string,
    public readonly referenceId: string,
    public readonly providerPaymentId: string,
    public readonly amount: number,
    public readonly currency: Currency,
    public readonly paymentMethod: PaymentMethod | null,
  ) {
    this.occurredAt = new Date();
  }
}
