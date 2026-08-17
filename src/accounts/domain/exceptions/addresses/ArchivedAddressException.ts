import { DomainException } from "../../../../shared-kernel/domain/exceptions/DomainException";

export class ArchivedAddressException extends DomainException {
  readonly code = "ARCHIVED_ADDRESS";
  readonly statusCode = 400;

  constructor() {
    super("No se puede marcar como predeterminada una dirección archivada.");
  }
}
