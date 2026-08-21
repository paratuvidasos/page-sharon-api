import { DomainException } from "../../../shared-kernel/domain/exceptions/DomainException";

export class UserNotFoundException extends DomainException {
  readonly code = "USER_NOT_FOUND";
  readonly statusCode = 404;

  constructor() {
    super("No se encontró la cuenta.");
  }
}
