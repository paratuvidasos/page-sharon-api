import { DomainException } from "./DomainException";

export class UnauthorizedException extends DomainException {
  readonly code = "UNAUTHORIZED";
  readonly statusCode = 401;

  constructor() {
    super("Debes iniciar sesión para realizar esta acción.");
  }
}
