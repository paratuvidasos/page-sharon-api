import { z } from "zod";
import {
  paginatedResponseSchema,
  PaginationQuerySchema,
} from "../../../../shared-kernel/infrastructure/http/pagination";
import { registry } from "../../../../shared-kernel/infrastructure/swagger/registry";
import { ReviewSort } from "../../../domain/enums/ReviewSort";
import { ReviewProductIdParamsSchema } from "./create-review.schema";

export const ListReviewsQuerySchema = PaginationQuerySchema.extend({
  sort: z.nativeEnum(ReviewSort).optional().default(ReviewSort.NEWEST),
});

export const ReviewItemSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  rating: z.number(),
  comment: z.string(),
  createdAt: z.string().datetime(),
  verifiedPurchase: z.literal(true).openapi({
    description: "Siempre true: solo se pueden crear reseñas de compras verificadas.",
  }),
});

export const RatingSummarySchema = z.object({
  average: z.number().nullable(),
  count: z.number(),
});

export const ListReviewsResponseSchema = paginatedResponseSchema(ReviewItemSchema).extend({
  ratingSummary: RatingSummarySchema,
});

registry.registerPath({
  method: "get",
  path: "/products/{productId}/reviews",
  tags: ["aftersales"],
  summary: "Listado paginado de reseñas de un producto, con calificación promedio y conteo total",
  request: { params: ReviewProductIdParamsSchema, query: ListReviewsQuerySchema },
  responses: {
    200: {
      description: "Página de reseñas del producto.",
      content: { "application/json": { schema: ListReviewsResponseSchema } },
    },
  },
});
