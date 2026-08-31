import { z } from "zod";
import { PaymentMethod } from "../../../../shared-kernel/domain/enums/PaymentMethod";
import { registry } from "../../../../shared-kernel/infrastructure/swagger/registry";
import { OrderSummaryResponseSchema, PaymentSessionResponseSchema } from "./checkout.schema";

/**
 * El invitado prueba su identidad con el correo del pedido. Quien tiene
 * sesión no necesita mandar nada: se valida contra el dueño del pedido.
 */
export const GetOrderQuerySchema = z.object({
  email: z.string().email().optional().openapi({
    description: "Obligatorio para pedidos de invitado: debe coincidir con el correo de la compra.",
  }),
});

export const RetryPaymentRequestSchema = z.object({
  paymentMethod: z.nativeEnum(PaymentMethod),
  paymentMethodLabel: z.string().max(100).nullable().optional(),
  documentNumber: z.string().max(30).nullable().optional(),
  email: z.string().email().optional().openapi({
    description: "Obligatorio para pedidos de invitado.",
  }),
});

export const RetryPaymentResponseSchema = z.object({
  order: OrderSummaryResponseSchema,
  payment: PaymentSessionResponseSchema,
});

registry.registerPath({
  method: "get",
  path: "/orders/{orderNumber}",
  tags: ["orders"],
  summary: "Consulta un pedido por su número",
  description:
    "Respalda la pantalla de confirmación ([0039]) y la de retorno de la pasarela: los parámetros que Bold agrega a la URL vienen del navegador, el estado real es este.",
  request: {
    params: z.object({ orderNumber: z.string() }),
    query: GetOrderQuerySchema,
  },
  responses: {
    200: {
      description: "Pedido encontrado.",
      content: { "application/json": { schema: OrderSummaryResponseSchema } },
    },
    404: {
      description:
        "El pedido no existe, o quien consulta no es su dueño. Se responde igual en ambos casos para no confirmar que un número ajeno es válido.",
    },
  },
});

registry.registerPath({
  method: "post",
  path: "/orders/{orderNumber}/retry-payment",
  tags: ["orders"],
  summary: "Reintenta el cobro de un pedido cuyo pago falló",
  description:
    "[0040]: conserva el pedido y su número, permite cambiar de método de pago, y vuelve a apartar el stock (que se liberó al rechazarse el pago). La referencia enviada a la pasarela siempre es nueva, porque Bold rechaza referencias repetidas.",
  request: {
    params: z.object({ orderNumber: z.string() }),
    body: { content: { "application/json": { schema: RetryPaymentRequestSchema } } },
  },
  responses: {
    200: {
      description: "Nuevo intento de pago listo.",
      content: { "application/json": { schema: RetryPaymentResponseSchema } },
    },
    404: { description: "El pedido no existe o no es de quien consulta." },
    409: {
      description:
        "El pedido no está en PAYMENT_FAILED, o algún producto se quedó sin stock desde el intento anterior.",
    },
  },
});
