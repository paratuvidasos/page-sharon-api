/**
 * Pasarelas de pago integradas. Hoy solo Bold; el enum existe para que el
 * proveedor quede persistido en cada intento y una migración futura a otra
 * pasarela no deje filas ambiguas en `payment_attempts`.
 */
export enum PaymentProvider {
  BOLD = "BOLD",
}
