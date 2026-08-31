import { PaymentApproved } from "../../../shared-kernel/domain/events/PaymentApproved";
import { PaymentRejected } from "../../../shared-kernel/domain/events/PaymentRejected";
import { DomainEventPublisher } from "../../../shared-kernel/domain/ports/DomainEventPublisher";
import { isTerminalPaymentStatus, PaymentStatus } from "../../domain/enums/PaymentStatus";
import { describePaymentFailure } from "../../domain/payment-failure-messages";
import { PaymentGatewayPort } from "../../domain/ports/PaymentGatewayPort";
import { PaymentAttemptRepository } from "../../domain/repositories/PaymentAttemptRepository";

export interface GetPaymentStatusInput {
  referenceId: string;
}

export interface GetPaymentStatusResult {
  referenceId: string;
  status: PaymentStatus;
  /** Mensaje apto para el usuario cuando el pago no prosperó. */
  message: string | null;
  settled: boolean;
}

/**
 * Consulta el estado de un intento de pago, conciliándolo contra la pasarela
 * si todavía no está resuelto.
 *
 * Existe porque el webhook puede demorarse: el comprador vuelve del redirect
 * de inmediato y la pantalla de resultado necesita algo que consultar
 * mientras tanto. Bold documenta explícitamente que una consulta hecha justo
 * después del pago puede responder `NO_TRANSACTION_FOUND`.
 *
 * Si la pasarela ya tiene un resultado final y el webhook no llegó, se aplica
 * acá y se publica el mismo evento de dominio — así el pedido avanza aunque
 * la notificación se haya perdido, sin duplicar efectos si después llega.
 */
export class GetPaymentStatus {
  constructor(
    private readonly paymentAttemptRepository: PaymentAttemptRepository,
    private readonly paymentGateway: PaymentGatewayPort,
    private readonly domainEventPublisher: DomainEventPublisher,
  ) {}

  async execute(input: GetPaymentStatusInput): Promise<GetPaymentStatusResult | null> {
    const attempt = await this.paymentAttemptRepository.findByReferenceId(input.referenceId);
    if (!attempt) {
      return null;
    }

    if (attempt.isSettled()) {
      return this.toResult(attempt.referenceId, attempt.status, attempt.toProps().failureReason);
    }

    if (attempt.isExpired(new Date())) {
      attempt.markExpired();
      await this.paymentAttemptRepository.save(attempt);
      const message = describePaymentFailure("EXPIRED_INTENT");
      await this.domainEventPublisher.publish(
        new PaymentRejected(attempt.orderId, attempt.referenceId, "EXPIRED_INTENT", message),
      );
      return this.toResult(attempt.referenceId, PaymentStatus.EXPIRED, message);
    }

    const remote = await this.paymentGateway.fetchTransactionStatus(attempt.referenceId);

    switch (remote.status) {
      case "APPROVED": {
        attempt.markApproved(remote.providerPaymentId ?? attempt.referenceId, remote.paymentMethod);
        await this.paymentAttemptRepository.save(attempt);
        await this.domainEventPublisher.publish(
          new PaymentApproved(
            attempt.orderId,
            attempt.referenceId,
            remote.providerPaymentId ?? attempt.referenceId,
            attempt.amount,
            attempt.currency,
            remote.paymentMethod,
          ),
        );
        return this.toResult(attempt.referenceId, PaymentStatus.APPROVED, null);
      }
      case "REJECTED":
      case "FAILED": {
        const message = describePaymentFailure(null);
        attempt.markRejected(
          remote.providerPaymentId,
          null,
          message,
          remote.status === "FAILED" ? PaymentStatus.FAILED : PaymentStatus.REJECTED,
        );
        await this.paymentAttemptRepository.save(attempt);
        await this.domainEventPublisher.publish(
          new PaymentRejected(attempt.orderId, attempt.referenceId, null, message),
        );
        return this.toResult(attempt.referenceId, attempt.status, message);
      }
      case "VOIDED": {
        attempt.markVoided(remote.providerPaymentId);
        await this.paymentAttemptRepository.save(attempt);
        return this.toResult(attempt.referenceId, PaymentStatus.VOIDED, null);
      }
      case "PROCESSING":
      case "PENDING": {
        attempt.markInProgress(
          remote.status === "PENDING" ? PaymentStatus.PENDING : PaymentStatus.PROCESSING,
        );
        await this.paymentAttemptRepository.save(attempt);
        return this.toResult(attempt.referenceId, attempt.status, null);
      }
      default:
        // NO_TRANSACTION_FOUND: el comprador todavía no completó el pago.
        return this.toResult(attempt.referenceId, attempt.status, null);
    }
  }

  private toResult(
    referenceId: string,
    status: PaymentStatus,
    message: string | null,
  ): GetPaymentStatusResult {
    return { referenceId, status, message, settled: isTerminalPaymentStatus(status) };
  }
}
