import { DomainException } from "./DomainException";

export class ForbiddenException extends DomainException {
  readonly code = "FORBIDDEN";
  readonly statusCode = 403;

  constructor() {
    super("No tienes permiso para realizar esta acción.");
  }
}
