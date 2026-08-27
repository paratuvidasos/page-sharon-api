import { DomainException } from "../../../shared-kernel/domain/exceptions/DomainException";
import { ProductStatus } from "../enums/ProductStatus";

/** [0057]: el producto no puede pasar de su estado actual al que pide el panel. */
export class InvalidProductStatusTransitionException extends DomainException {
  readonly code = "INVALID_PRODUCT_STATUS_TRANSITION";
  readonly statusCode = 409;

  constructor(from: ProductStatus, to: ProductStatus) {
    super(`El producto no puede pasar de ${from} a ${to}.`);
  }
}
