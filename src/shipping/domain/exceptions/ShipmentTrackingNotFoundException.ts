import { DomainException } from "../../../shared-kernel/domain/exceptions/DomainException";

/** El pedido consultado todavía no tiene un tracking registrado. */
export class ShipmentTrackingNotFoundException extends DomainException {
  readonly code = "SHIPMENT_TRACKING_NOT_FOUND";
  readonly statusCode = 404;

  constructor() {
    super("Este pedido todavía no tiene tracking registrado.");
  }
}
