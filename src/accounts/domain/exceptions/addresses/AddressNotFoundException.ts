import { DomainException } from "../../../../shared-kernel/domain/exceptions/DomainException";

export class AddressNotFoundException extends DomainException {
  readonly code = "ADDRESS_NOT_FOUND";
  readonly statusCode = 404;

  constructor() {
    super("No se encontró esa dirección.");
  }
}
