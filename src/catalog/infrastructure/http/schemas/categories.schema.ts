import { z } from "zod";
import {
  paginatedResponseSchema,
  PaginationQuerySchema,
} from "../../../../shared-kernel/infrastructure/http/pagination";
import { registry } from "../../../../shared-kernel/infrastructure/swagger/registry";

export const ListCategoriesQuerySchema = PaginationQuerySchema;

export const CategoryResponseSchema = z.object({
  id: z.string().uuid(),
  name: z.string().openapi({ example: "Shampoos" }),
  slug: z.string().openapi({ example: "shampoos" }),
  parentId: z.string().uuid().nullable(),
});

export const ListCategoriesResponseSchema = paginatedResponseSchema(CategoryResponseSchema);

registry.registerPath({
  method: "get",
  path: "/categories",
  tags: ["catalog"],
  summary: "Listado paginado de categorías del catálogo, para navegación y filtros",
  request: { query: ListCategoriesQuerySchema },
  responses: {
    200: {
      description: "Página de categorías.",
      content: { "application/json": { schema: ListCategoriesResponseSchema } },
    },
  },
});
