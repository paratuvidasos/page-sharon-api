import { DomainException } from "../../../shared-kernel/domain/exceptions/DomainException";

/**
 * [0035]: el método de pago elegido no está habilitado para el país y la
 * moneda del pedido. Se valida en el servidor y no solo al pintar la lista,
 * porque el cliente manda el método elegido en el body del checkout.
 */
export class PaymentMethodNotAvailableException extends DomainException {
  readonly code = "PAYMENT_METHOD_NOT_AVAILABLE";
  readonly statusCode = 422;

  constructor() {
    super("El método de pago seleccionado no está disponible para tu país o moneda.");
  }
}
