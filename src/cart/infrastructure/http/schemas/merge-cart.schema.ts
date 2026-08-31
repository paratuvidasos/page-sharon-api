import { registry } from "../../../../shared-kernel/infrastructure/swagger/registry";
import { CartResponseSchema } from "./get-cart.schema";

registry.registerPath({
  method: "post",
  path: "/cart/merge",
  tags: ["cart"],
  summary: "Fusionar el carrito de invitado con el carrito de la cuenta recién logueada",
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: "Carrito de usuario ya fusionado.",
      content: { "application/json": { schema: CartResponseSchema } },
    },
    401: { description: "Se requiere haber iniciado sesión." },
  },
});
