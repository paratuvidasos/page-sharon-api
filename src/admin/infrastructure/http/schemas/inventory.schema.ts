import { z } from "zod";
import { InventorySort } from "../../../../catalog/domain/enums/InventorySort";
import {
  paginatedResponseSchema,
  PaginationQuerySchema,
} from "../../../../shared-kernel/infrastructure/http/pagination";
import { registry } from "../../../../shared-kernel/infrastructure/swagger/registry";
import { ProductVariantParamsSchema } from "./product.schema";

export const SetVariantStockRequestSchema = z.object({
  quantity: z.number().int().nonnegative().openapi({ example: 42 }),
});

export const SetVariantLowStockThresholdRequestSchema = z.object({
  threshold: z.number().int().nonnegative().nullable().openapi({
    example: 5,
    description: "null = usar el umbral global.",
  }),
});

export const ListLowStockQuerySchema = PaginationQuerySchema;

export const ListInventoryQuerySchema = PaginationQuerySchema.extend({
  search: z.string().min(1).max(150).optional().openapi({
    description: "Coincidencia parcial contra el nombre del producto o el SKU de la variante.",
  }),
  categoryId: z.string().uuid().optional(),
  onlyLowStock: z
    .enum(["true", "false"])
    .transform((value) => value === "true")
    .optional()
    .openapi({ example: "true", description: "Mismo criterio que GET /admin/inventory/low-stock." }),
  sort: z.nativeEnum(InventorySort).default(InventorySort.NAME_ASC),
});

export const LowStockVariantResponseSchema = z.object({
  productId: z.string().uuid(),
  productName: z.string(),
  variantId: z.string().uuid(),
  sku: z.string(),
  variantLabel: z.string().nullable(),
  stockQuantity: z.number().int(),
  lowStockThreshold: z.number().int().nullable(),
});

export const ListLowStockResponseSchema = paginatedResponseSchema(LowStockVariantResponseSchema);
export const ListInventoryResponseSchema = paginatedResponseSchema(LowStockVariantResponseSchema);

registry.registerPath({
  method: "get",
  path: "/admin/inventory",
  tags: ["admin"],
  summary: "Lista todas las variantes con su stock, filtrable y ordenable (solo administradores)",
  description:
    "Inventario general — 'ver y editar el stock de cada producto y variante' (AC de [0059]). " +
    "Filtros: search (nombre de producto o SKU), categoryId, onlyLowStock. " +
    "sort: NAME_ASC (default), NAME_DESC, STOCK_ASC (menos a más stock), STOCK_DESC.",
  security: [{ bearerAuth: [] }],
  request: { query: ListInventoryQuerySchema },
  responses: {
    200: {
      description: "Página de variantes, en el orden pedido.",
      content: { "application/json": { schema: ListInventoryResponseSchema } },
    },
  },
});

registry.registerPath({
  method: "get",
  path: "/admin/inventory/low-stock",
  tags: ["admin"],
  summary: "Lista las variantes en stock bajo o agotado (solo administradores)",
  security: [{ bearerAuth: [] }],
  request: { query: ListLowStockQuerySchema },
  responses: {
    200: {
      description: "Página de variantes con `stock_quantity <= umbral`, agotadas primero.",
      content: { "application/json": { schema: ListLowStockResponseSchema } },
    },
  },
});

registry.registerPath({
  method: "patch",
  path: "/admin/products/{id}/variants/{variantId}/stock",
  tags: ["admin"],
  summary: "Corrige manualmente el stock de una variante (solo administradores)",
  description: "Set absoluto ('stock actual'), no un incremento.",
  security: [{ bearerAuth: [] }],
  request: {
    params: ProductVariantParamsSchema,
    body: { content: { "application/json": { schema: SetVariantStockRequestSchema } } },
  },
  responses: {
    204: { description: "Stock actualizado." },
    400: { description: "La cantidad no es válida." },
    404: { description: "El producto o la variante no existen." },
  },
});

registry.registerPath({
  method: "patch",
  path: "/admin/products/{id}/variants/{variantId}/low-stock-threshold",
  tags: ["admin"],
  summary: "Configura el umbral de stock bajo de una variante (solo administradores)",
  security: [{ bearerAuth: [] }],
  request: {
    params: ProductVariantParamsSchema,
    body: { content: { "application/json": { schema: SetVariantLowStockThresholdRequestSchema } } },
  },
  responses: {
    204: { description: "Umbral actualizado." },
    400: { description: "El umbral no es válido." },
    404: { description: "El producto o la variante no existen." },
  },
});
