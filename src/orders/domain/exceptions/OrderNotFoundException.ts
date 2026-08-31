import { DomainException } from "../../../shared-kernel/domain/exceptions/DomainException";

export class OrderNotFoundException extends DomainException {
  readonly code = "ORDER_NOT_FOUND";
  readonly statusCode = 404;

  constructor() {
    super("No encontramos ese pedido.");
  }
}
