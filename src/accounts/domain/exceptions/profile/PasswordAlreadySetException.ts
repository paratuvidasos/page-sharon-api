import { DomainException } from "../../../../shared-kernel/domain/exceptions/DomainException";

export class PasswordAlreadySetException extends DomainException {
  readonly code = "PASSWORD_ALREADY_SET";
  readonly statusCode = 409;

  constructor() {
    super("Tu cuenta ya tiene una contraseña. Usa el flujo de cambio de contraseña para actualizarla.");
  }
}
