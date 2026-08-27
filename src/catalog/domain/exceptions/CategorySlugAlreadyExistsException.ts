import { DomainException } from "../../../shared-kernel/domain/exceptions/DomainException";

/** [0058]: ya existe otra categoría con ese slug — la columna es única. */
export class CategorySlugAlreadyExistsException extends DomainException {
  readonly code = "CATEGORY_SLUG_ALREADY_EXISTS";
  readonly statusCode = 409;

  constructor(slug: string) {
    super(`Ya existe una categoría con el slug "${slug}".`);
  }
}
