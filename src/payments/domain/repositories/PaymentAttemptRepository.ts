import { PaymentAttempt } from "../entities/PaymentAttempt";

/**
 * Puerto de escritura del agregado `PaymentAttempt`. Sin read model aparte:
 * las consultas que existen hoy (por referencia, por pedido) devuelven el
 * agregado hidratado porque siempre terminan mutándolo.
 */
export interface PaymentAttemptRepository {
  save(attempt: PaymentAttempt): Promise<void>;

  findByReferenceId(referenceId: string): Promise<PaymentAttempt | null>;

  /**
   * Detecta reenvíos del mismo evento cuando la referencia no viaja en el
   * payload — Bold reintenta las notificaciones y puede repetir una ya
   * procesada.
   */
  findByProviderPaymentId(providerPaymentId: string): Promise<PaymentAttempt | null>;

  /** Intentos de un pedido, del más reciente al más antiguo. */
  findByOrderId(orderId: string): Promise<PaymentAttempt[]>;
}
