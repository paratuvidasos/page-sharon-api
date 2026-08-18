import { z } from "zod";
import {
  paginatedResponseSchema,
  PaginationQuerySchema,
} from "../../../../shared-kernel/infrastructure/http/pagination";
import { registry } from "../../../../shared-kernel/infrastructure/swagger/registry";
import { OrderStatus } from "../../../domain/enums/OrderStatus";
import { PaymentMethod } from "../../../domain/enums/PaymentMethod";

export const OrderHistoryQuerySchema = PaginationQuerySchema.extend({
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  status: z.nativeEnum(OrderStatus).optional(),
}).refine((query) => !query.dateFrom || !query.dateTo || query.dateFrom <= query.dateTo, {
  message: "dateFrom debe ser anterior o igual a dateTo.",
  path: ["dateFrom"],
});

const OrderHistoryLineItemSchema = z.object({
  productId: z.string().uuid(),
  productName: z.string().openapi({ example: "Shampoo reparador 400ml" }),
  sku: z.string().openapi({ example: "SH-REP-400" }),
  unitPrice: z.number().openapi({ example: 45900 }),
  quantity: z.number().int().openapi({ example: 2 }),
  lineTotal: z.number().openapi({ example: 91800 }),
});

const OrderHistoryShippingAddressSchema = z.object({
  recipientName: z.string().openapi({ example: "Sharon Gómez" }),
  phone: z.string().openapi({ example: "+573001234567" }),
  countryCode: z.string().openapi({ example: "CO" }),
  stateProvince: z.string().openapi({ example: "Cundinamarca" }),
  city: z.string().openapi({ example: "Bogotá" }),
  postalCode: z.string().openapi({ example: "110111" }),
  streetLine1: z.string().openapi({ example: "Calle 123 #45-67" }),
  streetLine2: z.string().nullable().openapi({ example: "Apto 501" }),
});

export const OrderHistoryItemResponseSchema = z.object({
  id: z.string().uuid(),
  orderNumber: z.string().openapi({ example: "ORD-000123" }),
  status: z.nativeEnum(OrderStatus),
  placedAt: z.string().datetime().openapi({ example: "2026-08-10T15:32:00.000Z" }),
  currency: z.string().openapi({ example: "COP" }),
  subtotal: z.number().openapi({ example: 91800 }),
  shippingCost: z.number().openapi({ example: 9900 }),
  total: z.number().openapi({ example: 101700 }),
  paymentMethod: z.nativeEnum(PaymentMethod),
  paymentMethodLabel: z.string().nullable().openapi({ example: "Visa •••• 4242" }),
  shippingAddress: OrderHistoryShippingAddressSchema,
  items: z.array(OrderHistoryLineItemSchema),
});

export const OrderHistoryResponseSchema = paginatedResponseSchema(OrderHistoryItemResponseSchema);

registry.registerPath({
  method: "get",
  path: "/orders",
  tags: ["orders"],
  summary: "Historial de pedidos del usuario autenticado, con filtros por rango de fechas y estado",
  request: {
    query: OrderHistoryQuerySchema,
  },
  responses: {
    200: {
      description: "Página de pedidos del usuario autenticado, ordenados del más reciente al más antiguo.",
      content: { "application/json": { schema: OrderHistoryResponseSchema } },
    },
    400: { description: "Filtros inválidos." },
    401: { description: "No autenticado." },
  },
  security: [{ bearerAuth: [] }],
});
