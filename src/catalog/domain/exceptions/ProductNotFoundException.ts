import { DomainException } from "../../../shared-kernel/domain/exceptions/DomainException";

export class ProductNotFoundException extends DomainException {
  readonly code = "PRODUCT_NOT_FOUND";
  readonly statusCode = 404;

  constructor() {
    super("No se encontró el producto.");
  }
}
