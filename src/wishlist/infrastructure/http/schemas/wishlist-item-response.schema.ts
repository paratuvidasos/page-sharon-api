import { z } from "zod";

export const WishlistProductIdParamsSchema = z.object({
  productId: z.string().uuid(),
});

export const WishlistItemResponseSchema = z.object({
  productId: z.string().uuid(),
  addedAt: z.string().datetime().openapi({ example: "2026-08-10T15:32:00.000Z" }),
});
