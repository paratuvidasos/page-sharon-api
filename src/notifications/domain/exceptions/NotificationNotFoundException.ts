import { DomainException } from "../../../shared-kernel/domain/exceptions/DomainException";

/**
 * [0044]: la notificación no existe, o es de otra persona. Se responde igual
 * en ambos casos para no confirmar que un id ajeno es válido — mismo criterio
 * que `OrderNotFoundException`.
 */
export class NotificationNotFoundException extends DomainException {
  readonly code = "NOTIFICATION_NOT_FOUND";
  readonly statusCode = 404;

  constructor() {
    super("La notificación no existe.");
  }
}
