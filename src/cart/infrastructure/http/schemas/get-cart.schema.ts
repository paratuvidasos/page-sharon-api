import { z } from "zod";
import { registry } from "../../../../shared-kernel/infrastructure/swagger/registry";

export const CartItemResponseSchema = z.object({
  itemId: z.string().uuid(),
  productId: z.string().uuid(),
  variantId: z.string().uuid(),
  productName: z.string(),
  variantLabel: z.string().nullable(),
  thumbnailUrl: z.string().nullable(),
  quantity: z.number().int(),
  unitPrice: z.number().openapi({ example: 45000 }),
  subtotal: z.number(),
  priceChanged: z.boolean(),
  unavailable: z.boolean(),
  availableStock: z.number().int(),
});

export const CartResponseSchema = z.object({
  items: z.array(CartItemResponseSchema),
  subtotal: z.number(),
  couponCode: z.string().nullable(),
  discount: z.number(),
  total: z.number(),
  couponInvalid: z.boolean(),
});

registry.registerPath({
  method: "get",
  path: "/cart",
  tags: ["cart"],
  summary: "Ver el contenido del carrito (usuario autenticado o invitado)",
  responses: {
    200: {
      description: "Carrito actual, con precios y disponibilidad vigentes.",
      content: { "application/json": { schema: CartResponseSchema } },
    },
  },
});
