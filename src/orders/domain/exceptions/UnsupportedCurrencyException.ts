import { DomainException } from "../../../shared-kernel/domain/exceptions/DomainException";

/**
 * [0041]: se pidió cobrar en una moneda que el comercio no tiene habilitada.
 * Se valida contra `SUPPORTED_CURRENCIES` y no solo contra el enum, para
 * poder apagar una moneda sin cambiar código.
 */
export class UnsupportedCurrencyException extends DomainException {
  readonly code = "UNSUPPORTED_CURRENCY";
  readonly statusCode = 422;

  constructor(currency: string) {
    super(`Por ahora no podemos procesar pagos en ${currency}.`);
  }
}
