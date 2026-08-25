import { z } from "zod";
import { OrderStatus } from "../../../../orders/domain/enums/OrderStatus";
import { OrderSummaryResponseSchema } from "../../../../orders/infrastructure/http/schemas/checkout.schema";
import { registry } from "../../../../shared-kernel/infrastructure/swagger/registry";

export const OrderFulfillmentParamsSchema = z.object({ orderNumber: z.string().min(1).max(30) });

/**
 * [0047]: los tres estados de cumplimiento que el panel puede fijar, sacados
 * del enum de dominio y no de una lista escrita a mano (ver sección "Enums"
 * del CLAUDE.md del repo). PENDING, PAID y PAYMENT_FAILED quedan fuera a
 * propósito: los decide la pasarela, no una persona.
 */
export const UpdateOrderFulfillmentStatusRequestSchema = z
  .object({
    status: z.enum([OrderStatus.IN_PREPARATION, OrderStatus.SHIPPED, OrderStatus.DELIVERED]),
    carrierCode: z.string().min(1).max(40).nullable().optional().openapi({ example: "SERVIENTREGA" }),
    carrierName: z.string().min(1).max(100).nullable().optional().openapi({ example: "Servientrega" }),
    trackingNumber: z.string().min(1).max(60).nullable().optional().openapi({ example: "1234567890" }),
    trackingUrl: z.string().url().max(500).nullable().optional(),
  })
  .superRefine((data, ctx) => {
    // La guía se pide acá y no se deja para después: un pedido "enviado" que
    // el comprador no puede rastrear es exactamente lo que [0047] viene a
    // evitar.
    if (data.status !== OrderStatus.SHIPPED) {
      return;
    }
    for (const field of ["carrierCode", "carrierName", "trackingNumber"] as const) {
      if (!data[field]) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Al marcar el pedido como enviado hay que registrar transportadora y número de guía.",
          path: [field],
        });
      }
    }
  });

registry.registerPath({
  method: "patch",
  path: "/admin/orders/{orderNumber}/status",
  tags: ["admin"],
  summary: "Cambia el estado de cumplimiento de un pedido (solo administradores)",
  description:
    "[0047]: marcar como enviado exige transportadora y número de guía. El cambio dispara la notificación al cliente ([0044]) y queda registrado en el historial de estados del pedido ([0043]).",
  security: [{ bearerAuth: [] }],
  request: {
    params: OrderFulfillmentParamsSchema,
    body: {
      content: { "application/json": { schema: UpdateOrderFulfillmentStatusRequestSchema } },
    },
  },
  responses: {
    200: {
      description: "Pedido actualizado.",
      content: { "application/json": { schema: OrderSummaryResponseSchema } },
    },
    400: { description: "Faltan datos de la guía, o el cuerpo es inválido." },
    404: { description: "El pedido no existe." },
    409: { description: "El pedido no puede pasar a ese estado desde el que tiene." },
  },
});
