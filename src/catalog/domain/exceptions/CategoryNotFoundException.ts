import { DomainException } from "../../../shared-kernel/domain/exceptions/DomainException";

/** [0058]: la categoría que el panel quiere editar o borrar ya no existe. */
export class CategoryNotFoundException extends DomainException {
  readonly code = "CATEGORY_NOT_FOUND";
  readonly statusCode = 404;

  constructor() {
    super("La categoría no existe.");
  }
}
