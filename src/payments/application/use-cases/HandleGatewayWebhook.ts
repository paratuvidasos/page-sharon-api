import { PaymentApproved } from "../../../shared-kernel/domain/events/PaymentApproved";
import { PaymentRejected } from "../../../shared-kernel/domain/events/PaymentRejected";
import { DomainEventPublisher } from "../../../shared-kernel/domain/ports/DomainEventPublisher";
import { PaymentAttempt } from "../../domain/entities/PaymentAttempt";
import { PaymentStatus } from "../../domain/enums/PaymentStatus";
import { InvalidWebhookSignatureException } from "../../domain/exceptions/InvalidWebhookSignatureException";
import { GatewayEvent, GatewayEventType, PaymentGatewayPort } from "../../domain/ports/PaymentGatewayPort";
import { PaymentAttemptRepository } from "../../domain/repositories/PaymentAttemptRepository";
import { describePaymentFailure } from "../../domain/payment-failure-messages";

export interface HandleGatewayWebhookInput {
  rawBody: Buffer;
  signature: string | undefined;
}

export interface HandleGatewayWebhookResult {
  /** false cuando el evento se descartó por repetido o por no tener a quién aplicarlo. */
  applied: boolean;
  reason?: string;
}

/**
 * Procesa una notificación de la pasarela ([0039] y [0040]).
 *
 * Dos propiedades no negociables:
 *
 * 1. **Autenticidad**: sin firma válida no se toca nada. Es lo único que
 *    separa un cobro real de que cualquiera marque pedidos como pagados.
 * 2. **Idempotencia**: Bold reintenta la notificación hasta cinco veces
 *    (15min → 1h → 4h → 8h → 24h) y puede reenviar una ya procesada. Un
 *    intento que ya está resuelto se ignora, así que reenviar el mismo evento
 *    no vuelve a descontar stock ni a redimir el cupón.
 *
 * No actualiza el pedido directamente: publica un evento de dominio y `orders`
 * reacciona (regla 3 del CLAUDE.md del repo).
 */
export class HandleGatewayWebhook {
  constructor(
    private readonly paymentAttemptRepository: PaymentAttemptRepository,
    private readonly paymentGateway: PaymentGatewayPort,
    private readonly domainEventPublisher: DomainEventPublisher,
  ) {}

  async execute(input: HandleGatewayWebhookInput): Promise<HandleGatewayWebhookResult> {
    if (!this.paymentGateway.verifyWebhookSignature(input.rawBody, input.signature)) {
      throw new InvalidWebhookSignatureException();
    }

    const event = this.paymentGateway.parseWebhookEvent(input.rawBody);
    const attempt = await this.resolveAttempt(event);

    if (!attempt) {
      // Se responde 200 igual: reintentar no va a hacer aparecer un intento
      // que no existe, y un 500 dejaría a Bold reintentando 24 horas.
      return { applied: false, reason: "NO_MATCHING_ATTEMPT" };
    }

    if (attempt.isSettled()) {
      return { applied: false, reason: "ALREADY_SETTLED" };
    }

    switch (event.type) {
      case GatewayEventType.SALE_APPROVED:
        return this.applyApproval(attempt, event);
      case GatewayEventType.SALE_REJECTED:
        return this.applyRejection(attempt, event);
      case GatewayEventType.VOID_APPROVED:
        attempt.markVoided(event.providerPaymentId);
        await this.paymentAttemptRepository.save(attempt);
        return { applied: true };
      case GatewayEventType.VOID_REJECTED:
        // La anulación falló, así que el cobro sigue en pie: el intento se
        // queda como está y no hay nada que propagarle al pedido.
        return { applied: false, reason: "VOID_REJECTED_NO_OP" };
      default:
        return { applied: false, reason: "UNKNOWN_EVENT_TYPE" };
    }
  }

  /**
   * La referencia propia es la vía principal; el id de pago de la pasarela es
   * el respaldo para el caso en que un evento no la traiga de vuelta en
   * `metadata`.
   */
  private async resolveAttempt(event: GatewayEvent): Promise<PaymentAttempt | null> {
    if (event.referenceId) {
      const byReference = await this.paymentAttemptRepository.findByReferenceId(event.referenceId);
      if (byReference) {
        return byReference;
      }
    }
    if (event.providerPaymentId) {
      return this.paymentAttemptRepository.findByProviderPaymentId(event.providerPaymentId);
    }
    return null;
  }

  private async applyApproval(
    attempt: PaymentAttempt,
    event: GatewayEvent,
  ): Promise<HandleGatewayWebhookResult> {
    // El monto se contrasta contra el que se firmó: una aprobación por un
    // valor distinto al cobrado no se toma como buena en automático.
    if (event.amount != null && Math.round(event.amount) !== Math.round(attempt.amount)) {
      attempt.markRejected(
        event.providerPaymentId,
        "AMOUNT_MISMATCH",
        "El monto aprobado no coincide con el monto del pedido.",
        PaymentStatus.FAILED,
      );
      await this.paymentAttemptRepository.save(attempt);
      await this.domainEventPublisher.publish(
        new PaymentRejected(
          attempt.orderId,
          attempt.referenceId,
          "AMOUNT_MISMATCH",
          describePaymentFailure("PROCESSING_ERROR"),
        ),
      );
      return { applied: true, reason: "AMOUNT_MISMATCH" };
    }

    attempt.markApproved(event.providerPaymentId, event.paymentMethod);
    await this.paymentAttemptRepository.save(attempt);

    await this.domainEventPublisher.publish(
      new PaymentApproved(
        attempt.orderId,
        attempt.referenceId,
        event.providerPaymentId,
        attempt.amount,
        attempt.currency,
        event.paymentMethod,
      ),
    );

    return { applied: true };
  }

  private async applyRejection(
    attempt: PaymentAttempt,
    event: GatewayEvent,
  ): Promise<HandleGatewayWebhookResult> {
    const message = describePaymentFailure(event.failureCode);
    attempt.markRejected(event.providerPaymentId, event.failureCode, message);
    await this.paymentAttemptRepository.save(attempt);

    await this.domainEventPublisher.publish(
      new PaymentRejected(attempt.orderId, attempt.referenceId, event.failureCode, message),
    );

    return { applied: true };
  }
}
