import { z } from "zod";
import {
  paginatedResponseSchema,
  PaginationQuerySchema,
} from "../../../../shared-kernel/infrastructure/http/pagination";
import { registry } from "../../../../shared-kernel/infrastructure/swagger/registry";
import { ProductListItemSchema } from "./list-products.schema";

export const SearchProductsQuerySchema = PaginationQuerySchema.extend({
  q: z.string().min(1),
});

export const SearchProductsResponseSchema = paginatedResponseSchema(ProductListItemSchema);

registry.registerPath({
  method: "get",
  path: "/products/search",
  tags: ["catalog"],
  summary: "Búsqueda de productos por palabra clave (nombre, descripción, marca, ingredientes y categoría)",
  request: { query: SearchProductsQuerySchema },
  responses: {
    200: {
      description: "Página de resultados de búsqueda, ordenados por relevancia.",
      content: { "application/json": { schema: SearchProductsResponseSchema } },
    },
  },
});
