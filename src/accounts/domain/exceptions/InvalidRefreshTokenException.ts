import { DomainException } from "../../../shared-kernel/domain/exceptions/DomainException";

export class InvalidRefreshTokenException extends DomainException {
  readonly code = "REFRESH_TOKEN_INVALID";
  readonly statusCode = 401;

  constructor() {
    super("Tu sesión expiró, vuelve a iniciar sesión.");
  }
}
