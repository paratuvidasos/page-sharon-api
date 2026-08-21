import { DomainException } from "../../../shared-kernel/domain/exceptions/DomainException";

export class AccountInactiveException extends DomainException {
  readonly code = "ACCOUNT_INACTIVE";
  readonly statusCode = 403;

  constructor() {
    super("Tu cuenta no está activa. Contacta a soporte.");
  }
}
