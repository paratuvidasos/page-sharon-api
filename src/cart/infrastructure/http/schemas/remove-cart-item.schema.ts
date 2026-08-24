import { registry } from "../../../../shared-kernel/infrastructure/swagger/registry";
import { CartItemParamsSchema } from "./update-cart-item.schema";
import { CartResponseSchema } from "./get-cart.schema";

registry.registerPath({
  method: "delete",
  path: "/cart/items/{itemId}",
  tags: ["cart"],
  summary: "Eliminar un producto del carrito",
  request: { params: CartItemParamsSchema },
  responses: {
    200: {
      description: "Carrito actualizado.",
      content: { "application/json": { schema: CartResponseSchema } },
    },
    404: { description: "El ítem no existe en el carrito." },
  },
});
