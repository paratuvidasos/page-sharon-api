import { DomainException } from "../../../shared-kernel/domain/exceptions/DomainException";

export class AccountLockedException extends DomainException {
  readonly code = "ACCOUNT_LOCKED";
  readonly statusCode = 423;

  constructor(retryAfterMinutes: number) {
    const minutes = Math.max(1, retryAfterMinutes);
    super(
      `Tu cuenta está bloqueada temporalmente por múltiples intentos fallidos. Intenta de nuevo en ${minutes} minuto${minutes === 1 ? "" : "s"}.`,
    );
  }
}
