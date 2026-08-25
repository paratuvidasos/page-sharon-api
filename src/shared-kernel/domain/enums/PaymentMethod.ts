/**
 * Métodos de pago del negocio. Movido aquí desde `orders/domain/enums` al
 * integrar Bold ([0036]): `orders` lo persiste en su columna `payment_method`
 * y `payments` lo necesita para mapear lo que devuelve la pasarela. Duplicarlo
 * en ambos módulos crearía exactamente las dos listas desincronizadas que
 * prohíbe la sección "Enums" del CLAUDE.md del repo.
 *
 * `orders/domain/enums/PaymentMethod.ts` queda como re-export para no romper
 * los imports existentes.
 */
export enum PaymentMethod {
  CREDIT_CARD = "CREDIT_CARD",
  DEBIT_CARD = "DEBIT_CARD",
  PAYPAL = "PAYPAL",
  BANK_TRANSFER = "BANK_TRANSFER",
  CASH_ON_DELIVERY = "CASH_ON_DELIVERY",
  /** PSE: débito bancario en línea, el método más usado en Colombia después de la tarjeta. */
  PSE = "PSE",
  NEQUI = "NEQUI",
  BANCOLOMBIA_BUTTON = "BANCOLOMBIA_BUTTON",
}
