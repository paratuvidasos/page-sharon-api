import { z } from "zod";
import { registry } from "../../../../shared-kernel/infrastructure/swagger/registry";
import { ShipmentTrackingStatus } from "../../../../shipping/domain/enums/ShipmentTrackingStatus";

export const ShipmentTrackingParamsSchema = z.object({ orderId: z.string().uuid() });

const ShipmentTrackingEventSchema = z.object({
  status: z.nativeEnum(ShipmentTrackingStatus),
  description: z.string(),
  location: z.string().nullable(),
  occurredAt: z.coerce.date(),
});

export const ShipmentTrackingResponseSchema = z.object({
  status: z.nativeEnum(ShipmentTrackingStatus),
  carrierCode: z.string(),
  trackingNumber: z.string(),
  events: z.array(ShipmentTrackingEventSchema),
  lastSyncedAt: z.coerce.date().nullable(),
});

registry.registerPath({
  method: "get",
  path: "/admin/shipping/tracking/{orderId}",
  tags: ["admin"],
  summary: "Estado real de tracking de un pedido despachado, según Track123 (solo administradores)",
  security: [{ bearerAuth: [] }],
  request: { params: ShipmentTrackingParamsSchema },
  responses: {
    200: {
      description: "Último estado sincronizado del envío.",
      content: { "application/json": { schema: ShipmentTrackingResponseSchema } },
    },
    404: { description: "El pedido todavía no tiene tracking registrado." },
  },
});
