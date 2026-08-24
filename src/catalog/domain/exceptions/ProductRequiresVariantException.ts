import { DomainException } from "../../../shared-kernel/domain/exceptions/DomainException";

export class ProductRequiresVariantException extends DomainException {
  readonly code = "PRODUCT_REQUIRES_VARIANT";
  readonly statusCode = 400;

  constructor() {
    super("El producto debe tener al menos una variante.");
  }
}
