import { PaymentAttempt } from "../../../domain/entities/PaymentAttempt";
import { PaymentAttemptOrmEntity } from "../entities/PaymentAttemptOrmEntity";

/**
 * Convierte entre el agregado de dominio y la fila de Postgres (regla 5 del
 * CLAUDE.md del repo: la entidad de dominio nunca es la entidad de TypeORM).
 * Los montos van y vuelven de `numeric`, que el driver entrega como string.
 */
export class PaymentAttemptMapper {
  static toDomain(orm: PaymentAttemptOrmEntity): PaymentAttempt {
    return PaymentAttempt.reconstitute({
      id: orm.id,
      orderId: orm.orderId,
      referenceId: orm.referenceId,
      provider: orm.provider,
      providerPaymentId: orm.providerPaymentId,
      amount: Number(orm.amount),
      currency: orm.currency,
      status: orm.status,
      paymentMethod: orm.paymentMethod,
      failureCode: orm.failureCode,
      failureReason: orm.failureReason,
      expiresAt: orm.expiresAt,
      createdAt: orm.createdAt,
      updatedAt: orm.updatedAt,
    });
  }

  static toOrm(attempt: PaymentAttempt): PaymentAttemptOrmEntity {
    const props = attempt.toProps();
    const orm = new PaymentAttemptOrmEntity();
    orm.id = props.id;
    orm.orderId = props.orderId;
    orm.referenceId = props.referenceId;
    orm.provider = props.provider;
    orm.providerPaymentId = props.providerPaymentId;
    orm.amount = props.amount.toFixed(2);
    orm.currency = props.currency;
    orm.status = props.status;
    orm.paymentMethod = props.paymentMethod;
    orm.failureCode = props.failureCode;
    orm.failureReason = props.failureReason;
    orm.expiresAt = props.expiresAt;
    orm.createdAt = props.createdAt;
    orm.updatedAt = props.updatedAt;
    return orm;
  }
}
