import { DomainException } from "../../../shared-kernel/domain/exceptions/DomainException";

export class GuestEmailRequiredException extends DomainException {
  readonly code = "GUEST_EMAIL_REQUIRED";
  readonly statusCode = 400;

  constructor() {
    super("Ingresa un correo para completar la compra como invitado.");
  }
}
