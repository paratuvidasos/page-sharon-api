import { z } from "zod";
import { registry } from "../../../../shared-kernel/infrastructure/swagger/registry";
import { CartResponseSchema } from "./get-cart.schema";

export const AddCartItemRequestSchema = z.object({
  variantId: z.string().uuid(),
  quantity: z.number().int().positive(),
});

registry.registerPath({
  method: "post",
  path: "/cart/items",
  tags: ["cart"],
  summary: "Agregar una variante de producto al carrito",
  request: { body: { content: { "application/json": { schema: AddCartItemRequestSchema } } } },
  responses: {
    200: {
      description: "Carrito actualizado.",
      content: { "application/json": { schema: CartResponseSchema } },
    },
    409: { description: "Stock insuficiente o producto no disponible." },
  },
});
