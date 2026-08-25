import { DomainException } from "../../../shared-kernel/domain/exceptions/DomainException";

/**
 * Se intentó simular un pago con una pasarela real activa.
 *
 * Es 404 y no 403 a propósito: en producción el endpoint de simulación no
 * debe siquiera parecer que existe. Poder declarar un pago como aprobado sin
 * que entre plata es justo lo que jamás puede quedar expuesto.
 */
export class PaymentSimulationNotAvailableException extends DomainException {
  readonly code = "PAYMENT_SIMULATION_NOT_AVAILABLE";
  readonly statusCode = 404;

  constructor() {
    super("La simulación de pagos no está disponible.");
  }
}
