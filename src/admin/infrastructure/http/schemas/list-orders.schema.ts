import { z } from "zod";
import { OrderStatus } from "../../../../orders/domain/enums/OrderStatus";
import { PaymentMethod } from "../../../../orders/domain/enums/PaymentMethod";
import { OrderHistoryItemResponseSchema } from "../../../../orders/infrastructure/http/schemas/order-history.schema";
import { OrderDetailResponseSchema } from "../../../../orders/infrastructure/http/schemas/order-detail.schema";
import {
  paginatedResponseSchema,
  PaginationQuerySchema,
} from "../../../../shared-kernel/infrastructure/http/pagination";
import { registry } from "../../../../shared-kernel/infrastructure/swagger/registry";

/** [0060]: listado admin — filtrable por estado, fecha y método de pago (AC). */
export const AdminListOrdersQuerySchema = PaginationQuerySchema.extend({
  status: z.nativeEnum(OrderStatus).optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  paymentMethod: z.nativeEnum(PaymentMethod).optional(),
}).refine((query) => !query.dateFrom || !query.dateTo || query.dateFrom <= query.dateTo, {
  message: "dateFrom debe ser anterior o igual a dateTo.",
  path: ["dateFrom"],
});

export const AdminOrderParamsSchema = z.object({ orderNumber: z.string().min(1).max(30) });

export const AdminOrderListResponseSchema = paginatedResponseSchema(OrderHistoryItemResponseSchema);

registry.registerPath({
  method: "get",
  path: "/admin/orders",
  tags: ["admin"],
  summary: "Lista todos los pedidos, filtrable por estado, fecha y método de pago (solo administradores)",
  security: [{ bearerAuth: [] }],
  request: { query: AdminListOrdersQuerySchema },
  responses: {
    200: {
      description: "Página de pedidos, del más reciente al más antiguo.",
      content: { "application/json": { schema: AdminOrderListResponseSchema } },
    },
  },
});

registry.registerPath({
  method: "get",
  path: "/admin/orders/{orderNumber}",
  tags: ["admin"],
  summary: "Detalle de un pedido, sin restricción de dueño (solo administradores)",
  security: [{ bearerAuth: [] }],
  request: { params: AdminOrderParamsSchema },
  responses: {
    200: {
      description: "Detalle del pedido.",
      content: { "application/json": { schema: OrderDetailResponseSchema } },
    },
    404: { description: "El pedido no existe." },
  },
});
