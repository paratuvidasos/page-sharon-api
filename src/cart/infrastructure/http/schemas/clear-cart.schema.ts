import { registry } from "../../../../shared-kernel/infrastructure/swagger/registry";
import { CartResponseSchema } from "./get-cart.schema";

registry.registerPath({
  method: "delete",
  path: "/cart",
  tags: ["cart"],
  summary: "Vaciar el carrito completo",
  responses: {
    200: {
      description: "Carrito vacío.",
      content: { "application/json": { schema: CartResponseSchema } },
    },
  },
});
