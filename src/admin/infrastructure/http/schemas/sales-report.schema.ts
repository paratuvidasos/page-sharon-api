import { z } from "zod";
import { registry } from "../../../../shared-kernel/infrastructure/swagger/registry";

export const SalesReportQuerySchema = z
  .object({
    dateFrom: z.coerce.date(),
    dateTo: z.coerce.date(),
  })
  .refine((query) => query.dateFrom <= query.dateTo, {
    message: "dateFrom debe ser anterior o igual a dateTo.",
    path: ["dateFrom"],
  });

export const SalesSummaryResponseSchema = z.object({
  totalSales: z.number().openapi({ example: 12500000 }),
  averageTicket: z.number().openapi({ example: 98500 }),
  orderCount: z.number().int().openapi({ example: 127 }),
});

export const TopProductResponseSchema = z.object({
  productId: z.string().uuid(),
  productName: z.string(),
  unitsSold: z.number().int(),
  revenue: z.number(),
});

export const SalesReportResponseSchema = z.object({
  summary: SalesSummaryResponseSchema,
  topProducts: z.array(TopProductResponseSchema),
});

registry.registerPath({
  method: "get",
  path: "/admin/reports/sales",
  tags: ["admin"],
  summary: "Ventas totales, ticket promedio y productos más vendidos por rango de fechas (solo administradores)",
  description:
    "Solo cuenta pedidos PAID/IN_PREPARATION/SHIPPED/DELIVERED — un pedido cancelado o reembolsado no infla las ventas.",
  security: [{ bearerAuth: [] }],
  request: { query: SalesReportQuerySchema },
  responses: {
    200: {
      description: "Resumen de ventas y top de productos del período.",
      content: { "application/json": { schema: SalesReportResponseSchema } },
    },
    400: { description: "El rango de fechas es inválido." },
  },
});

registry.registerPath({
  method: "get",
  path: "/admin/reports/sales/export",
  tags: ["admin"],
  summary: "Exporta el detalle de pedidos del período en CSV (solo administradores)",
  security: [{ bearerAuth: [] }],
  request: { query: SalesReportQuerySchema },
  responses: {
    200: {
      description: "Archivo CSV con una fila por pedido.",
      content: { "text/csv": { schema: { type: "string" } } },
    },
    400: { description: "El rango de fechas es inválido." },
  },
});
