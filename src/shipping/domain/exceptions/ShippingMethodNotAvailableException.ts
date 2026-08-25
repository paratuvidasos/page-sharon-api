import { DomainException } from "../../../shared-kernel/domain/exceptions/DomainException";

/**
 * El método de envío que se pidió no está entre los disponibles para esa
 * dirección. Se lanza al recotizar en el checkout ([0038]), donde el cliente
 * manda el método que eligió y el servidor lo vuelve a validar en vez de
 * confiar en él.
 */
export class ShippingMethodNotAvailableException extends DomainException {
  readonly code = "SHIPPING_METHOD_NOT_AVAILABLE";
  readonly statusCode = 422;

  constructor() {
    super("El método de envío seleccionado ya no está disponible para esa dirección.");
  }
}
