import { DomainException } from "../../../shared-kernel/domain/exceptions/DomainException";

/** [0060]: cancelar o reembolsar un pedido sin motivo deja al historial sin poder explicar por qué. */
export class CancellationReasonRequiredException extends DomainException {
  readonly code = "CANCELLATION_REASON_REQUIRED";
  readonly statusCode = 400;

  constructor() {
    super("Para cancelar o reembolsar un pedido hay que indicar el motivo.");
  }
}
