import { DomainException } from "../../../shared-kernel/domain/exceptions/DomainException";

/**
 * [0049]: la configuración de una zona no cumple sus invariantes. Es 400 y no
 * 422 porque quien la manda es el panel administrativo: son datos mal
 * formados, no una regla de negocio que impida cumplir una petición válida.
 */
export class InvalidShippingZoneException extends DomainException {
  readonly code = "INVALID_SHIPPING_ZONE";
  readonly statusCode = 400;

  constructor(message: string) {
    super(message);
  }
}
