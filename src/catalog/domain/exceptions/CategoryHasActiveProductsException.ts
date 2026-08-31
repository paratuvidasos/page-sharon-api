import { DomainException } from "../../../shared-kernel/domain/exceptions/DomainException";

/**
 * [0058]: "no se puede eliminar una categoría con productos activos
 * asociados sin reasignarlos primero" (AC). El admin reasigna cada producto
 * editando su categoría (`UpdateProduct`, [0057]) antes de reintentar el
 * borrado.
 */
export class CategoryHasActiveProductsException extends DomainException {
  readonly code = "CATEGORY_HAS_ACTIVE_PRODUCTS";
  readonly statusCode = 409;

  constructor() {
    super("La categoría tiene productos activos asociados. Reasígnalos antes de eliminarla.");
  }
}
