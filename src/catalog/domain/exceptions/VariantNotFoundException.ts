import { DomainException } from "../../../shared-kernel/domain/exceptions/DomainException";

/** [0057]: la variante que el panel quiere editar o borrar ya no existe en el producto. */
export class VariantNotFoundException extends DomainException {
  readonly code = "VARIANT_NOT_FOUND";
  readonly statusCode = 404;

  constructor() {
    super("La variante no existe en este producto.");
  }
}
