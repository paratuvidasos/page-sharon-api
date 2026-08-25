import { DomainException } from "../../../shared-kernel/domain/exceptions/DomainException";
import { OrderStatus } from "../enums/OrderStatus";

/**
 * Se intentó mover un pedido a un estado al que no puede llegar desde donde
 * está. Es la red que impide, por ejemplo, que un webhook duplicado vuelva a
 * "pagar" un pedido ya pagado.
 */
export class InvalidOrderStatusTransitionException extends DomainException {
  readonly code = "INVALID_ORDER_STATUS_TRANSITION";
  readonly statusCode = 409;

  constructor(from: OrderStatus, to: OrderStatus) {
    super(`Un pedido en estado ${from} no puede pasar a ${to}.`);
  }
}
