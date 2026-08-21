import { DomainException } from "../../../shared-kernel/domain/exceptions/DomainException";

export class OrderMustHaveOwnerException extends DomainException {
  readonly code = "ORDER_MUST_HAVE_OWNER";
  readonly statusCode = 400;

  constructor() {
    super("El pedido debe estar asociado a un usuario autenticado o a un correo de invitado, pero no ambos.");
  }
}
