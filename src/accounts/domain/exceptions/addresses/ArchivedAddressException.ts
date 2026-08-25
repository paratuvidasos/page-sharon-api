import { DomainException } from "../../../../shared-kernel/domain/exceptions/DomainException";

export class ArchivedAddressException extends DomainException {
  readonly code = "ARCHIVED_ADDRESS";
  readonly statusCode = 400;

  /**
   * El mensaje es parametrizable porque una dirección archivada bloquea dos
   * acciones distintas: marcarla como predeterminada, y usarla como destino
   * de un pedido nuevo ([0033]). Un solo texto genérico quedaría vago en
   * ambos casos.
   */
  constructor(message = "No se puede marcar como predeterminada una dirección archivada.") {
    super(message);
  }
}
