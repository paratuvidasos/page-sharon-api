import { z } from "zod";
import { registry } from "../../../../shared-kernel/infrastructure/swagger/registry";
import { CartResponseSchema } from "./get-cart.schema";

export const ApplyCouponRequestSchema = z.object({
  code: z.string().min(1).max(40),
});

registry.registerPath({
  method: "post",
  path: "/cart/coupon",
  tags: ["cart"],
  summary: "Aplicar un cupón de descuento al carrito",
  request: { body: { content: { "application/json": { schema: ApplyCouponRequestSchema } } } },
  responses: {
    200: {
      description: "Carrito con el cupón aplicado.",
      content: { "application/json": { schema: CartResponseSchema } },
    },
    400: { description: "El cupón no es válido (vencido, no vigente aún, compra mínima no alcanzada o límite de usos)." },
    404: { description: "El cupón no existe." },
  },
});
