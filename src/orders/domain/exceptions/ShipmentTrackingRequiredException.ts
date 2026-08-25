import { DomainException } from "../../../shared-kernel/domain/exceptions/DomainException";

/**
 * [0047]: marcar un pedido como enviado sin guía ni transportadora dejaría al
 * comprador con un "ya salió" que no puede rastrear, que es justo lo que la
 * historia viene a resolver. Por eso el dato es obligatorio en la transición y
 * no una columna opcional que alguien complete después.
 */
export class ShipmentTrackingRequiredException extends DomainException {
  readonly code = "SHIPMENT_TRACKING_REQUIRED";
  readonly statusCode = 400;

  constructor() {
    super("Para marcar el pedido como enviado hay que registrar la transportadora y el número de guía.");
  }
}
