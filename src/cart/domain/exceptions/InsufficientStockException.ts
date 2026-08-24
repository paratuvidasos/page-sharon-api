import { DomainException } from "../../../shared-kernel/domain/exceptions/DomainException";

/**
 * [0029]: además del mensaje, guarda `availableQuantity` para que el
 * controller pueda ofrecer "agregar la cantidad máxima disponible" sin que
 * el frontend tenga que volver a consultar el stock.
 */
export class InsufficientStockException extends DomainException {
  readonly code = "INSUFFICIENT_STOCK";
  readonly statusCode = 409;

  constructor(readonly availableQuantity: number) {
    super(`Solo hay ${availableQuantity} unidad(es) disponible(s) de este producto.`);
  }
}
