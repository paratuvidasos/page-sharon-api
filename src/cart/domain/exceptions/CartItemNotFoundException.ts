import { DomainException } from "../../../shared-kernel/domain/exceptions/DomainException";

export class CartItemNotFoundException extends DomainException {
  readonly code = "CART_ITEM_NOT_FOUND";
  readonly statusCode = 404;

  constructor() {
    super("No se encontró el producto en el carrito.");
  }
}
