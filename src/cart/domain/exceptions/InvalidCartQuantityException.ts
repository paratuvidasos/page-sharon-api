import { DomainException } from "../../../shared-kernel/domain/exceptions/DomainException";

export class InvalidCartQuantityException extends DomainException {
  readonly code = "INVALID_CART_QUANTITY";
  readonly statusCode = 400;

  constructor() {
    super("La cantidad debe ser mayor a cero.");
  }
}
