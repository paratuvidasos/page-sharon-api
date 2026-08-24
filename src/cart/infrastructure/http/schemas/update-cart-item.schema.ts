import { z } from "zod";
import { registry } from "../../../../shared-kernel/infrastructure/swagger/registry";
import { CartResponseSchema } from "./get-cart.schema";

export const CartItemParamsSchema = z.object({
  itemId: z.string().uuid(),
});

export const UpdateCartItemRequestSchema = z.object({
  quantity: z.number().int().positive(),
});

registry.registerPath({
  method: "patch",
  path: "/cart/items/{itemId}",
  tags: ["cart"],
  summary: "Modificar la cantidad de un producto en el carrito",
  request: { params: CartItemParamsSchema, body: { content: { "application/json": { schema: UpdateCartItemRequestSchema } } } },
  responses: {
    200: {
      description: "Carrito actualizado.",
      content: { "application/json": { schema: CartResponseSchema } },
    },
    404: { description: "El ítem no existe en el carrito." },
    409: { description: "Stock insuficiente." },
  },
});
