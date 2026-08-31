/**
 * [0040]: traduce el motivo de rechazo que devuelve la pasarela a un mensaje
 * que un comprador pueda entender y accionar.
 *
 * Vive en `domain` y no junto a la integración de Bold porque lo consume un
 * caso de uso, y `application` no puede importar de `infrastructure` (regla 1
 * del CLAUDE.md del repo). Los códigos son los que reporta la pasarela, pero
 * "qué se le dice al comprador cuando le rechazan el pago" es una decisión de
 * negocio, no un detalle de la integración.
 *
 * El criterio de aceptación pide mostrar el motivo "sin usar mensajes
 * técnicos", así que el string crudo de Bold nunca se le devuelve al usuario:
 * lo que no esté en este mapa cae al mensaje genérico. Los códigos vienen de
 * los rechazos de red financiera que Bold reporta en el webhook.
 */
const MESSAGES_BY_CODE: Record<string, string> = {
  INSUFFICIENT_FUNDS: "La tarjeta no tiene fondos suficientes. Intenta con otro método de pago.",
  INVALID_CARD: "Los datos de la tarjeta no son correctos. Revísalos e intenta de nuevo.",
  EXPIRED_CARD: "La tarjeta está vencida. Intenta con otra.",
  INVALID_CVV: "El código de seguridad no coincide. Revísalo e intenta de nuevo.",
  CARD_NOT_AUTHORIZED:
    "Tu banco no autorizó la compra. Comunícate con ellos o intenta con otro método de pago.",
  RESTRICTED_CARD: "Tu banco tiene restringida esta tarjeta para compras en línea.",
  EXCEEDS_LIMIT: "La compra supera el cupo disponible de la tarjeta.",
  SUSPECTED_FRAUD: "Tu banco bloqueó la transacción por seguridad. Comunícate con ellos.",
  ABANDONED: "El pago quedó sin completar. Puedes intentarlo de nuevo cuando quieras.",
  EXPIRED_INTENT: "Se venció el tiempo para completar el pago. Intenta de nuevo.",
  REJECTED_BY_BANK:
    "Tu banco rechazó la transacción. Intenta con otra tarjeta u otro método de pago.",
  PROCESSING_ERROR:
    "Hubo un problema procesando el pago y no se te cobró nada. Intenta de nuevo en unos minutos.",
};

const GENERIC_MESSAGE =
  "No pudimos procesar tu pago y no se te cobró nada. Intenta de nuevo o usa otro método de pago.";

export function describePaymentFailure(failureCode: string | null): string {
  if (!failureCode) {
    return GENERIC_MESSAGE;
  }
  return MESSAGES_BY_CODE[failureCode.toUpperCase()] ?? GENERIC_MESSAGE;
}
