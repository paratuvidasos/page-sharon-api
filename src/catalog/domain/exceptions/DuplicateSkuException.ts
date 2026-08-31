import { DomainException } from "../../../shared-kernel/domain/exceptions/DomainException";

/** [0057]: ya existe una variante (de cualquier producto) con ese SKU. */
export class DuplicateSkuException extends DomainException {
  readonly code = "DUPLICATE_SKU";
  readonly statusCode = 409;

  constructor(sku: string) {
    super(`Ya existe una variante con el SKU "${sku}".`);
  }
}
