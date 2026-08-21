import { z } from "zod";
import { registry } from "../../../../shared-kernel/infrastructure/swagger/registry";
import { WishlistItemResponseSchema } from "./wishlist-item-response.schema";

export const AddToWishlistRequestSchema = z.object({
  productId: z.string().uuid().openapi({ example: "0f2a9c9e-8b1a-7c1a-9c1a-1c1e1e1e1e1e" }),
});

export type AddToWishlistRequest = z.infer<typeof AddToWishlistRequestSchema>;

registry.registerPath({
  method: "post",
  path: "/wishlist/items",
  tags: ["wishlist"],
  summary: "Agrega un producto a la lista de deseos del usuario autenticado",
  request: {
    body: {
      content: { "application/json": { schema: AddToWishlistRequestSchema } },
    },
  },
  responses: {
    201: {
      description: "Producto agregado (o ya estaba en la lista — la operación es idempotente).",
      content: { "application/json": { schema: WishlistItemResponseSchema } },
    },
    400: { description: "productId inválido." },
    401: { description: "No autenticado." },
  },
  security: [{ bearerAuth: [] }],
});
