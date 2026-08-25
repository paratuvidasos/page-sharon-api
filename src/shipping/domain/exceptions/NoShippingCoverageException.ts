import { DomainException } from "../../../shared-kernel/domain/exceptions/DomainException";

/**
 * [0034]: no hay ninguna zona activa que cubra la dirección de destino. Es
 * 422 y no 404: la petición está bien formada, pero no se puede cumplir con
 * las tarifas configuradas hoy.
 */
export class NoShippingCoverageException extends DomainException {
  readonly code = "NO_SHIPPING_COVERAGE";
  readonly statusCode = 422;

  constructor() {
    super("Todavía no tenemos cobertura de envío para esa dirección.");
  }
}
