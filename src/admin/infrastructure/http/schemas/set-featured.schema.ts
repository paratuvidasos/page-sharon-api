import { z } from "zod";
import { registry } from "../../../../shared-kernel/infrastructure/swagger/registry";

export const SetFeaturedParamsSchema = z.object({
  id: z.string().uuid(),
});

export const SetFeaturedRequestSchema = z.object({
  isFeatured: z.boolean(),
});

registry.registerPath({
  method: "patch",
  path: "/admin/products/{id}/featured",
  tags: ["admin"],
  summary: "Marcar/desmarcar un producto como destacado en la home — requiere rol ADMIN",
  request: {
    params: SetFeaturedParamsSchema,
    body: { content: { "application/json": { schema: SetFeaturedRequestSchema } } },
  },
  responses: {
    204: { description: "Actualizado." },
    401: { description: "No autenticado." },
    403: { description: "El usuario no tiene rol ADMIN." },
    404: { description: "No se encontró el producto." },
  },
  security: [{ bearerAuth: [] }],
});
