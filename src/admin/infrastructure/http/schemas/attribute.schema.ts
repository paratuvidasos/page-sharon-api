import { z } from "zod";
import { registry } from "../../../../shared-kernel/infrastructure/swagger/registry";

const AttributeValueOptionSchema = z.object({
  value: z.string().min(1).max(80).openapi({ example: "rizado" }),
  label: z.string().min(1).max(120).openapi({ example: "Cabello rizado" }),
});

export const CreateAttributeRequestSchema = z.object({
  key: z.string().min(1).max(60).openapi({ example: "hairType" }),
  label: z.string().min(1).max(150).openapi({ example: "Tipo de cabello" }),
  values: z.array(AttributeValueOptionSchema).default([]),
});

export const UpdateAttributeRequestSchema = z.object({
  label: z.string().min(1).max(150).optional(),
  values: z.array(AttributeValueOptionSchema).optional(),
});

export const AttributeParamsSchema = z.object({ id: z.string().uuid() });

export const AttributeAdminResponseSchema = z.object({
  id: z.string().uuid(),
  key: z.string(),
  label: z.string(),
  values: z.array(AttributeValueOptionSchema),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export const ListAttributesResponseSchema = z.object({
  items: z.array(AttributeAdminResponseSchema),
});

export const CreateAttributeResponseSchema = z.object({ id: z.string().uuid() });

registry.registerPath({
  method: "get",
  path: "/admin/attributes",
  tags: ["admin"],
  summary: "Lista el vocabulario controlado de atributos de producto (solo administradores)",
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: "Todos los atributos definidos.",
      content: { "application/json": { schema: ListAttributesResponseSchema } },
    },
  },
});

registry.registerPath({
  method: "post",
  path: "/admin/attributes",
  tags: ["admin"],
  summary: "Crea un atributo de producto (solo administradores)",
  security: [{ bearerAuth: [] }],
  request: { body: { content: { "application/json": { schema: CreateAttributeRequestSchema } } } },
  responses: {
    201: {
      description: "Atributo creado.",
      content: { "application/json": { schema: CreateAttributeResponseSchema } },
    },
    400: { description: "El atributo no es válido." },
    409: { description: "Ya existe un atributo con esa key." },
  },
});

registry.registerPath({
  method: "patch",
  path: "/admin/attributes/{id}",
  tags: ["admin"],
  summary: "Edita un atributo de producto (solo administradores)",
  description: "La key no se puede cambiar una vez creado el atributo.",
  security: [{ bearerAuth: [] }],
  request: {
    params: AttributeParamsSchema,
    body: { content: { "application/json": { schema: UpdateAttributeRequestSchema } } },
  },
  responses: {
    204: { description: "Atributo actualizado." },
    400: { description: "El atributo no es válido." },
    404: { description: "El atributo no existe." },
  },
});

registry.registerPath({
  method: "delete",
  path: "/admin/attributes/{id}",
  tags: ["admin"],
  summary: "Elimina un atributo de producto (solo administradores)",
  security: [{ bearerAuth: [] }],
  request: { params: AttributeParamsSchema },
  responses: {
    204: { description: "Atributo eliminado." },
    404: { description: "El atributo no existe." },
  },
});
