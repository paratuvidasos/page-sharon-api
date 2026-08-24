import { z } from "zod";
import {
  paginatedResponseSchema,
  PaginationQuerySchema,
} from "../../../../shared-kernel/infrastructure/http/pagination";
import { registry } from "../../../../shared-kernel/infrastructure/swagger/registry";
import { ProductSort } from "../../../domain/enums/ProductSort";
import { StockStatus } from "../../../domain/enums/StockStatus";

export const ListProductsQuerySchema = PaginationQuerySchema.extend({
  categoryId: z.string().uuid().optional(),
  hairType: z.string().optional(),
  line: z.string().optional(),
  ingredient: z.string().optional(),
  priceMin: z.coerce.number().nonnegative().optional(),
  priceMax: z.coerce.number().nonnegative().optional(),
  sort: z.nativeEnum(ProductSort).optional(),
});

export const ProductRatingSchema = z.object({
  average: z.number().nullable().openapi({ example: 4.5 }),
  count: z.number().openapi({ example: 12 }),
});

export const ProductListItemSchema = z.object({
  id: z.string().uuid(),
  slug: z.string().openapi({ example: "shampoo-reparador-argan-500ml" }),
  name: z.string().openapi({ example: "Shampoo reparador de argán" }),
  thumbnailUrl: z.string().nullable(),
  basePrice: z.number().openapi({ example: 45000 }),
  compareAtPrice: z.number().nullable().openapi({ example: 39000 }),
  stockStatus: z.nativeEnum(StockStatus),
  rating: ProductRatingSchema,
});

export const ListProductsResponseSchema = paginatedResponseSchema(ProductListItemSchema);

registry.registerPath({
  method: "get",
  path: "/products",
  tags: ["catalog"],
  summary:
    "Listado paginado de productos activos del catálogo, filtrable por categoría, atributos (tipo de cabello, línea, ingrediente), rango de precio y ordenable (precio, más vendidos, más recientes)",
  request: { query: ListProductsQuerySchema },
  responses: {
    200: {
      description: "Página de productos.",
      content: { "application/json": { schema: ListProductsResponseSchema } },
    },
  },
});
