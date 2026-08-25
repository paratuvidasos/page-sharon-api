/**
 * [0044]: qué se le dice al cliente en cada estado.
 *
 * Vive en la capa de aplicación de `notifications` y no en `orders` porque es
 * texto de comunicación, no una regla del pedido: cambiar "va en camino" por
 * otra frase no debería tocar el módulo que administra pedidos.
 *
 * Los estados que **no** están acá no generan aviso, y eso es deliberado:
 *
 *  - `PAID` ya manda el correo de confirmación de compra ([0039]); un segundo
 *    correo diciendo lo mismo sería spam.
 *  - `PENDING` y `PAYMENT_FAILED` los resuelve la propia pantalla de pago, con
 *    el comprador ahí mirando.
 */
export interface OrderStatusMessage {
  heading: string;
  message: string;
}

const MESSAGES: Record<string, OrderStatusMessage> = {
  IN_PREPARATION: {
    heading: "Estamos preparando tu pedido",
    message:
      "Ya empezamos a armar tu pedido. Te avisamos de nuevo apenas salga para tu dirección.",
  },
  SHIPPED: {
    heading: "Tu pedido va en camino",
    message: "Tu pedido salió para tu dirección. Podés seguirlo con el número de guía.",
  },
  DELIVERED: {
    heading: "Tu pedido fue entregado",
    message: "Tu pedido llegó a destino. Si algo no está como esperabas, escribinos.",
  },
};

export function messageForStatus(status: string): OrderStatusMessage | null {
  return MESSAGES[status] ?? null;
}
