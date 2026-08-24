import { registry } from "../../../../shared-kernel/infrastructure/swagger/registry";
import { CartResponseSchema } from "./get-cart.schema";

registry.registerPath({
  method: "delete",
  path: "/cart/coupon",
  tags: ["cart"],
  summary: "Quitar el cupón aplicado al carrito",
  responses: {
    200: {
      description: "Carrito sin cupón.",
      content: { "application/json": { schema: CartResponseSchema } },
    },
  },
});
