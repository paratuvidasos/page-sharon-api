import { z } from "zod";
import {
  paginatedResponseSchema,
  PaginationQuerySchema,
} from "../../../../shared-kernel/infrastructure/http/pagination";
import { registry } from "../../../../shared-kernel/infrastructure/swagger/registry";

export const ListCategoriesAdminQuerySchema = PaginationQuerySchema;

export const CreateCategoryRequestSchema = z.object({
  name: z.string().min(1).max(150).openapi({ example: "Shampoos" }),
  slug: z.string().min(1).max(160).openapi({ example: "shampoos" }),
  parentId: z.string().uuid().nullable().optional(),
});

export const UpdateCategoryRequestSchema = z.object({
  name: z.string().min(1).max(150).optional(),
  slug: z.string().min(1).max(160).optional(),
  parentId: z.string().uuid().nullable().optional(),
});

export const CategoryParamsSchema = z.object({ id: z.string().uuid() });

export const CategoryAdminResponseSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  slug: z.string(),
  parentId: z.string().uuid().nullable(),
});

export const ListCategoriesAdminResponseSchema = paginatedResponseSchema(CategoryAdminResponseSchema);

export const CreateCategoryResponseSchema = z.object({ id: z.string().uuid() });

registry.registerPath({
  method: "get",
  path: "/admin/categories",
  tags: ["admin"],
  summary: "Lista las categorías del catálogo para el panel administrativo (solo administradores)",
  security: [{ bearerAuth: [] }],
  request: { query: ListCategoriesAdminQuerySchema },
  responses: {
    200: {
      description: "Página de categorías.",
      content: { "application/json": { schema: ListCategoriesAdminResponseSchema } },
    },
  },
});

registry.registerPath({
  method: "post",
  path: "/admin/categories",
  tags: ["admin"],
  summary: "Crea una categoría del catálogo (solo administradores)",
  security: [{ bearerAuth: [] }],
  request: { body: { content: { "application/json": { schema: CreateCategoryRequestSchema } } } },
  responses: {
    201: {
      description: "Categoría creada.",
      content: { "application/json": { schema: CreateCategoryResponseSchema } },
    },
    400: { description: "La categoría no es válida." },
    409: { description: "Ya existe una categoría con ese slug." },
  },
});

registry.registerPath({
  method: "patch",
  path: "/admin/categories/{id}",
  tags: ["admin"],
  summary: "Edita una categoría del catálogo (solo administradores)",
  security: [{ bearerAuth: [] }],
  request: {
    params: CategoryParamsSchema,
    body: { content: { "application/json": { schema: UpdateCategoryRequestSchema } } },
  },
  responses: {
    204: { description: "Categoría actualizada." },
    400: { description: "La categoría no es válida." },
    404: { description: "La categoría no existe." },
    409: { description: "Ya existe una categoría con ese slug." },
  },
});

registry.registerPath({
  method: "delete",
  path: "/admin/categories/{id}",
  tags: ["admin"],
  summary: "Elimina una categoría del catálogo (solo administradores)",
  description:
    "No se puede eliminar una categoría con productos ACTIVE asociados; hay que reasignarlos primero editando cada producto.",
  security: [{ bearerAuth: [] }],
  request: { params: CategoryParamsSchema },
  responses: {
    204: { description: "Categoría eliminada." },
    404: { description: "La categoría no existe." },
    409: { description: "La categoría tiene productos activos asociados." },
  },
});
