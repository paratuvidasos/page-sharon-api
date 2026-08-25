import { randomBytes } from "node:crypto";

/** Bold acepta hasta 60 caracteres alfanuméricos, guiones y guiones bajos. */
const MAX_REFERENCE_LENGTH = 60;

/**
 * Referencia única de un intento de pago, la que viaja a la pasarela como
 * `data-order-id`.
 *
 * Lleva el número de pedido adelante para que una transacción en el panel de
 * Bold se pueda rastrear hasta su pedido de un vistazo, y un sufijo aleatorio
 * porque un reintento ([0040]) es un intento nuevo y Bold rechaza referencias
 * repetidas.
 */
export function generatePaymentReference(orderNumber: string): string {
  const suffix = randomBytes(4).toString("hex").toUpperCase();
  const sanitized = orderNumber.replace(/[^A-Za-z0-9_-]/g, "");
  return `${sanitized}-${suffix}`.slice(0, MAX_REFERENCE_LENGTH);
}
