import { DomainException } from "../../../shared-kernel/domain/exceptions/DomainException";

export class PasswordResetTokenInvalidException extends DomainException {
  readonly code = "PASSWORD_RESET_TOKEN_INVALID";
  readonly statusCode = 400;

  constructor() {
    super("El enlace de recuperación es inválido o ya expiró.");
  }
}
