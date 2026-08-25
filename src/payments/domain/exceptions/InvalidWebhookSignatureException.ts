import { DomainException } from "../../../shared-kernel/domain/exceptions/DomainException";

/**
 * La firma `x-bold-signature` no coincide con el HMAC del body. Se responde
 * 401 y no se ejecuta ninguna lógica de negocio: sin esta verificación,
 * cualquiera que conozca la URL del webhook podría marcar pedidos como
 * pagados.
 */
export class InvalidWebhookSignatureException extends DomainException {
  readonly code = "INVALID_WEBHOOK_SIGNATURE";
  readonly statusCode = 401;

  constructor() {
    super("La firma del webhook no es válida.");
  }
}
