import { DomainException } from "../../../shared-kernel/domain/exceptions/DomainException";

/** Datos de guía/transportadora inválidos al registrar un tracking. */
export class InvalidShipmentTrackingException extends DomainException {
  readonly code = "INVALID_SHIPMENT_TRACKING";
  readonly statusCode = 400;

  constructor(message: string) {
    super(message);
  }
}
