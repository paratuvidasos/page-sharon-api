import { z } from "zod";
import { registry } from "../../../../shared-kernel/infrastructure/swagger/registry";
import { GatewayEventType } from "../../../domain/ports/PaymentGatewayPort";

/**
 * Los códigos son los mismos que traduce `payment-failure-messages`, para
 * poder probar en local cada mensaje que vería un comprador ([0040]).
 */
export const SimulatePaymentRequestSchema = z.object({
  referenceId: z.string().min(1).openapi({ example: "ORD-20260824-AB12CD-9F3E7A21" }),
  outcome: z
    .enum([GatewayEventType.SALE_APPROVED, GatewayEventType.SALE_REJECTED])
    .openapi({ example: GatewayEventType.SALE_APPROVED }),
  failureCode: z.string().max(60).nullable().optional().openapi({
    example: "INSUFFICIENT_FUNDS",
    description: "Solo para SALE_REJECTED. Determina el mensaje que se le muestra al comprador.",
  }),
});

export const SimulatePaymentResponseSchema = z.object({
  applied: z.boolean(),
  reason: z.string().optional(),
});

registry.registerPath({
  method: "post",
  path: "/payments/simulate",
  tags: ["payments"],
  summary: "Resuelve un pago simulado (solo con la pasarela simulada activa)",
  description:
    "Existe para probar el checkout completo sin cuenta de Bold. Fabrica el mismo webhook firmado que mandaría la pasarela y lo procesa por el camino real, así que la idempotencia y los eventos de dominio se comportan igual que en producción. Con credenciales de Bold configuradas responde 404.",
  request: {
    body: { content: { "application/json": { schema: SimulatePaymentRequestSchema } } },
  },
  responses: {
    200: {
      description: "Evento procesado. `applied: false` si se descartó por repetido.",
      content: { "application/json": { schema: SimulatePaymentResponseSchema } },
    },
    404: {
      description: "La pasarela activa no es la simulada, o no existe esa referencia de pago.",
    },
  },
});
