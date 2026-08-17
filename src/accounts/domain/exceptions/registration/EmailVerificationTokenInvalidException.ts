import { DomainException } from "../../../../shared-kernel/domain/exceptions/DomainException";

export class EmailVerificationTokenInvalidException extends DomainException {
  readonly code = "EMAIL_VERIFICATION_TOKEN_INVALID";
  readonly statusCode = 400;

  constructor() {
    super("El enlace de verificación es inválido o ya expiró.");
  }
}
