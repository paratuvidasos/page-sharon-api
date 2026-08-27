import { z } from "zod";
import { ReviewStatus } from "../../../../aftersales/domain/enums/ReviewStatus";
import {
  paginatedResponseSchema,
  PaginationQuerySchema,
} from "../../../../shared-kernel/infrastructure/http/pagination";
import { registry } from "../../../../shared-kernel/infrastructure/swagger/registry";

export const ListReviewsForModerationQuerySchema = PaginationQuerySchema.extend({
  status: z.nativeEnum(ReviewStatus).optional(),
});

export const ReviewParamsSchema = z.object({ id: z.string().uuid() });

export const RejectReviewRequestSchema = z.object({
  reason: z.string().min(1).max(300).openapi({ example: "Contenido ofensivo, no relacionado con el producto." }),
});

export const ModerationReviewResponseSchema = z.object({
  id: z.string().uuid(),
  productId: z.string().uuid(),
  userId: z.string().uuid(),
  rating: z.number().int(),
  comment: z.string(),
  status: z.nativeEnum(ReviewStatus),
  rejectionReason: z.string().nullable(),
  createdAt: z.coerce.date(),
});

export const ListReviewsForModerationResponseSchema = paginatedResponseSchema(ModerationReviewResponseSchema);

registry.registerPath({
  method: "get",
  path: "/admin/reviews",
  tags: ["admin"],
  summary: "Cola de moderación de reseñas, filtrable por estado (solo administradores)",
  security: [{ bearerAuth: [] }],
  request: { query: ListReviewsForModerationQuerySchema },
  responses: {
    200: {
      description: "Página de reseñas.",
      content: { "application/json": { schema: ListReviewsForModerationResponseSchema } },
    },
  },
});

registry.registerPath({
  method: "patch",
  path: "/admin/reviews/{id}/approve",
  tags: ["admin"],
  summary: "Aprueba una reseña pendiente de moderación (solo administradores)",
  security: [{ bearerAuth: [] }],
  request: { params: ReviewParamsSchema },
  responses: {
    204: { description: "Reseña aprobada." },
    404: { description: "La reseña no existe." },
    409: { description: "La reseña no está pendiente de moderación." },
  },
});

registry.registerPath({
  method: "patch",
  path: "/admin/reviews/{id}/reject",
  tags: ["admin"],
  summary: "Rechaza una reseña pendiente de moderación, con motivo (solo administradores)",
  description: "Notifica al cliente por correo con el motivo del rechazo.",
  security: [{ bearerAuth: [] }],
  request: {
    params: ReviewParamsSchema,
    body: { content: { "application/json": { schema: RejectReviewRequestSchema } } },
  },
  responses: {
    204: { description: "Reseña rechazada." },
    400: { description: "Falta el motivo." },
    404: { description: "La reseña no existe." },
    409: { description: "La reseña no está pendiente de moderación." },
  },
});

registry.registerPath({
  method: "patch",
  path: "/admin/reviews/{id}/hide",
  tags: ["admin"],
  summary: "Oculta una reseña ya publicada (solo administradores)",
  security: [{ bearerAuth: [] }],
  request: { params: ReviewParamsSchema },
  responses: {
    204: { description: "Reseña oculta." },
    404: { description: "La reseña no existe." },
    409: { description: "La reseña no está publicada." },
  },
});
