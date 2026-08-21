import { DomainException } from "../../../shared-kernel/domain/exceptions/DomainException";

export class CannotCreateAccountWhileAuthenticatedException extends DomainException {
  readonly code = "ALREADY_AUTHENTICATED";
  readonly statusCode = 400;

  constructor() {
    super("Ya iniciaste sesión, no es posible crear una cuenta nueva desde el checkout.");
  }
}
