import { DomainException } from "../../../../shared-kernel/domain/exceptions/DomainException";

export class InvalidClerkSessionException extends DomainException {
  readonly code = "INVALID_CLERK_SESSION";
  readonly statusCode = 401;

  constructor() {
    super("La sesión de Google no pudo verificarse. Intenta iniciar sesión de nuevo.");
  }
}
