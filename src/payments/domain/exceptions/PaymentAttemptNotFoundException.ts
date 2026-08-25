import { DomainException } from "../../../shared-kernel/domain/exceptions/DomainException";

export class PaymentAttemptNotFoundException extends DomainException {
  readonly code = "PAYMENT_ATTEMPT_NOT_FOUND";
  readonly statusCode = 404;

  constructor() {
    super("No encontramos un intento de pago con esa referencia.");
  }
}
