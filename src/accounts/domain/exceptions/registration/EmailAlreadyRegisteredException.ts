import { DomainException } from "../../../../shared-kernel/domain/exceptions/DomainException";

export class EmailAlreadyRegisteredException extends DomainException {
  readonly code = "EMAIL_ALREADY_REGISTERED";
  readonly statusCode = 409;

  constructor() {
    super("Ya existe una cuenta con este correo. Inicia sesión en su lugar.");
  }
}
