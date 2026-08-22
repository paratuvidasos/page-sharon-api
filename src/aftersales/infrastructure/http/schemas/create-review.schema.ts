import { z } from "zod";
import { registry } from "../../../../shared-kernel/infrastructure/swagger/registry";

export const ReviewProductIdParamsSchema = z.object({
  productId: z.string().uuid(),
});

export const CreateReviewRequestSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().min(1).max(2000),
});

export const CreateReviewResponseSchema = z.object({
  id: z.string().uuid(),
  rating: z.number(),
  comment: z.string(),
  createdAt: z.string().datetime(),
});

registry.registerPath({
  method: "post",
  path: "/products/{productId}/reviews",
  tags: ["aftersales"],
  summary: "Crear una reseña de producto — exige que el usuario haya comprado el producto",
  request: {
    params: ReviewProductIdParamsSchema,
    body: { content: { "application/json": { schema: CreateReviewRequestSchema } } },
  },
  responses: {
    201: {
      description: "Reseña creada.",
      content: { "application/json": { schema: CreateReviewResponseSchema } },
    },
    401: { description: "No autenticado." },
    403: { description: "El usuario no ha comprado el producto." },
    409: { description: "El usuario ya reseñó este producto." },
  },
  security: [{ bearerAuth: [] }],
});
