import { DomainException } from "../../../shared-kernel/domain/exceptions/DomainException";

/** [0049]: la zona que el panel quiere editar o borrar ya no existe. */
export class ShippingZoneNotFoundException extends DomainException {
  readonly code = "SHIPPING_ZONE_NOT_FOUND";
  readonly statusCode = 404;

  constructor() {
    super("La zona de envío no existe.");
  }
}
