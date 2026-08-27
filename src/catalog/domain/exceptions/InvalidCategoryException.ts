import { DomainException } from "../../../shared-kernel/domain/exceptions/DomainException";

/**
 * [0058]: la categoría que manda el panel administrativo no cumple sus
 * invariantes. Es 400 y no 422 por el mismo motivo que
 * `InvalidShippingZoneException`: quien la manda es el panel, son datos mal
 * formados, no una regla de negocio que impida cumplir una petición válida.
 */
export class InvalidCategoryException extends DomainException {
  readonly code = "INVALID_CATEGORY";
  readonly statusCode = 400;

  constructor(message: string) {
    super(message);
  }
}
