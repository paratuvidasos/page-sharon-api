import { Currency } from "../../../shared-kernel/domain/enums/Currency";
import { PaymentMethod } from "../../../shared-kernel/domain/enums/PaymentMethod";
import { PaymentProvider } from "../enums/PaymentProvider";
import { isTerminalPaymentStatus, PaymentStatus } from "../enums/PaymentStatus";

export interface PaymentAttemptProps {
  id: string;
  orderId: string;
  referenceId: string;
  provider: PaymentProvider;
  providerPaymentId: string | null;
  amount: number;
  currency: Currency;
  status: PaymentStatus;
  paymentMethod: PaymentMethod | null;
  failureCode: string | null;
  failureReason: string | null;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreatePaymentAttemptInput {
  id: string;
  orderId: string;
  referenceId: string;
  provider: PaymentProvider;
  amount: number;
  currency: Currency;
  paymentMethod: PaymentMethod | null;
  expiresAt: Date;
}

/**
 * Un intento de cobro contra la pasarela, identificado por la referencia
 * única que se le envía (`data-order-id` en Bold).
 *
 * Hay un intento por cada vez que el comprador arranca el pago, no uno por
 * pedido: [0040] exige poder reintentar tras un rechazo, y Bold exige que la
 * referencia sea única, así que un reintento es un intento nuevo sobre el
 * mismo pedido. El historial de rechazos queda, que es justo lo que permite
 * decirle al usuario por qué le fallo el pago la vez anterior.
 */
export class PaymentAttempt {
  private constructor(private props: PaymentAttemptProps) {}

  static create(input: CreatePaymentAttemptInput): PaymentAttempt {
    const now = new Date();
    return new PaymentAttempt({
      id: input.id,
      orderId: input.orderId,
      referenceId: input.referenceId,
      provider: input.provider,
      providerPaymentId: null,
      amount: input.amount,
      currency: input.currency,
      status: PaymentStatus.CREATED,
      paymentMethod: input.paymentMethod,
      failureCode: null,
      failureReason: null,
      expiresAt: input.expiresAt,
      createdAt: now,
      updatedAt: now,
    });
  }

  static reconstitute(props: PaymentAttemptProps): PaymentAttempt {
    return new PaymentAttempt(props);
  }

  get id(): string {
    return this.props.id;
  }

  get orderId(): string {
    return this.props.orderId;
  }

  get referenceId(): string {
    return this.props.referenceId;
  }

  get status(): PaymentStatus {
    return this.props.status;
  }

  get providerPaymentId(): string | null {
    return this.props.providerPaymentId;
  }

  get amount(): number {
    return this.props.amount;
  }

  get currency(): Currency {
    return this.props.currency;
  }

  /**
   * Un intento ya resuelto no vuelve a cambiar. Es la base de la
   * idempotencia del webhook: Bold reintenta la notificación hasta 5 veces
   * (15min → 1h → 4h → 8h → 24h) y puede reenviar una que ya procesamos.
   */
  isSettled(): boolean {
    return isTerminalPaymentStatus(this.props.status);
  }

  isExpired(now: Date): boolean {
    return !this.isSettled() && now > this.props.expiresAt;
  }

  markApproved(providerPaymentId: string, paymentMethod: PaymentMethod | null): void {
    this.transitionTo(PaymentStatus.APPROVED);
    this.props.providerPaymentId = providerPaymentId;
    if (paymentMethod) {
      this.props.paymentMethod = paymentMethod;
    }
    this.props.failureCode = null;
    this.props.failureReason = null;
  }

  markRejected(
    providerPaymentId: string | null,
    failureCode: string | null,
    failureReason: string | null,
    status: PaymentStatus.REJECTED | PaymentStatus.FAILED = PaymentStatus.REJECTED,
  ): void {
    this.transitionTo(status);
    this.props.providerPaymentId = providerPaymentId;
    this.props.failureCode = failureCode;
    this.props.failureReason = failureReason;
  }

  markVoided(providerPaymentId: string | null): void {
    this.transitionTo(PaymentStatus.VOIDED);
    if (providerPaymentId) {
      this.props.providerPaymentId = providerPaymentId;
    }
  }

  markExpired(): void {
    this.transitionTo(PaymentStatus.EXPIRED);
  }

  /** Estados no finales que reporta la pasarela mientras la transacción avanza. */
  markInProgress(status: PaymentStatus.PROCESSING | PaymentStatus.PENDING): void {
    this.transitionTo(status);
  }

  private transitionTo(status: PaymentStatus): void {
    this.props.status = status;
    this.props.updatedAt = new Date();
  }

  toProps(): PaymentAttemptProps {
    return { ...this.props };
  }
}
