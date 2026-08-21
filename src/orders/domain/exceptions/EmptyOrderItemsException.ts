import { DomainException } from "../../../shared-kernel/domain/exceptions/DomainException";

export class EmptyOrderItemsException extends DomainException {
  readonly code = "EMPTY_ORDER_ITEMS";
  readonly statusCode = 400;

  constructor() {
    super("El pedido debe tener al menos un producto.");
  }
}
