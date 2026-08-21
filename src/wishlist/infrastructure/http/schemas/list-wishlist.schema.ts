import {
  paginatedResponseSchema,
  PaginationQuerySchema,
} from "../../../../shared-kernel/infrastructure/http/pagination";
import { registry } from "../../../../shared-kernel/infrastructure/swagger/registry";
import { WishlistItemResponseSchema } from "./wishlist-item-response.schema";

export const ListWishlistQuerySchema = PaginationQuerySchema;

export const ListWishlistResponseSchema = paginatedResponseSchema(WishlistItemResponseSchema);

registry.registerPath({
  method: "get",
  path: "/wishlist",
  tags: ["wishlist"],
  summary: "Lista paginada de productos en la lista de deseos del usuario autenticado",
  request: { query: ListWishlistQuerySchema },
  responses: {
    200: {
      description: "Página de la lista de deseos, ordenada del más reciente al más antiguo.",
      content: { "application/json": { schema: ListWishlistResponseSchema } },
    },
    401: { description: "No autenticado." },
  },
  security: [{ bearerAuth: [] }],
});
