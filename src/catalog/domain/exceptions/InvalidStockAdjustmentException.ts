import { DomainException } from "../../../shared-kernel/domain/exceptions/DomainException";

/** [0059]: el stock o el umbral que manda el panel administrativo no es un entero válido (>= 0). */
export class InvalidStockAdjustmentException extends DomainException {
  readonly code = "INVALID_STOCK_ADJUSTMENT";
  readonly statusCode = 400;

  constructor(value: number) {
    super(`"${value}" no es una cantidad de stock válida.`);
  }
}
