/**
 * Estado de un intento de pago. Refleja los estados que Bold reporta en su
 * consulta de transacciones (`PROCESSING`, `PENDING`, `APPROVED`, `REJECTED`,
 * `FAILED`, `VOIDED`), más dos propios:
 *
 * - `CREATED`: la referencia ya se firmó y se le entregó al navegador, pero
 *   el comprador todavía no abrió la pasarela. Para Bold esto es
 *   `NO_TRANSACTION_FOUND`.
 * - `EXPIRED`: se venció la ventana de pago y nunca hubo transacción.
 */
export enum PaymentStatus {
  CREATED = "CREATED",
  PROCESSING = "PROCESSING",
  /** Solo PSE: el débito quedó en curso y se resuelve de forma asíncrona. */
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
  FAILED = "FAILED",
  VOIDED = "VOIDED",
  EXPIRED = "EXPIRED",
}

/** Estados de los que un intento ya no se mueve. */
const TERMINAL_STATUSES: ReadonlySet<PaymentStatus> = new Set([
  PaymentStatus.APPROVED,
  PaymentStatus.REJECTED,
  PaymentStatus.FAILED,
  PaymentStatus.VOIDED,
  PaymentStatus.EXPIRED,
]);

export function isTerminalPaymentStatus(status: PaymentStatus): boolean {
  return TERMINAL_STATUSES.has(status);
}
