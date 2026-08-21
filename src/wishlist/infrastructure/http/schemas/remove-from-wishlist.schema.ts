import { registry } from "../../../../shared-kernel/infrastructure/swagger/registry";
import { WishlistProductIdParamsSchema } from "./wishlist-item-response.schema";

registry.registerPath({
  method: "delete",
  path: "/wishlist/items/{productId}",
  tags: ["wishlist"],
  summary: "Quita un producto de la lista de deseos del usuario autenticado",
  request: { params: WishlistProductIdParamsSchema },
  responses: {
    204: { description: "Producto quitado (o ya no estaba — la operación es idempotente)." },
    401: { description: "No autenticado." },
  },
  security: [{ bearerAuth: [] }],
});
