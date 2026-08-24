import { DomainException } from "../../../shared-kernel/domain/exceptions/DomainException";

export class CartProductUnavailableException extends DomainException {
  readonly code = "CART_PRODUCT_UNAVAILABLE";
  readonly statusCode = 409;

  constructor() {
    super("Este producto ya no está disponible.");
  }
}
