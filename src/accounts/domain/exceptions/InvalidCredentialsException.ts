import { DomainException } from "../../../shared-kernel/domain/exceptions/DomainException";

export class InvalidCredentialsException extends DomainException {
  readonly code = "INVALID_CREDENTIALS";
  readonly statusCode = 401;

  constructor() {
    super("El correo o la contraseña son incorrectos.");
  }
}
