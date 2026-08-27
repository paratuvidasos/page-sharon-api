import { DomainException } from "../../../shared-kernel/domain/exceptions/DomainException";

/** [0057]: no se puede quitar la última variante — dejaría al producto sin nada para vender. */
export class ProductMustHaveOneVariantException extends DomainException {
  readonly code = "PRODUCT_MUST_HAVE_ONE_VARIANT";
  readonly statusCode = 409;

  constructor() {
    super("El producto necesita al menos una variante.");
  }
}
