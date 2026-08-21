import { z } from "zod";
import { registry } from "../../../../shared-kernel/infrastructure/swagger/registry";

export const MAX_MEMBERSHIP_PRODUCT_IDS = 100;

// Se valida por separado del schema "crudo" que documenta Swagger (abajo)
// porque el de aquí transforma el string separado por comas en un array —
// mismo motivo que AddressRequestBodySchema/buildAddressRequestSchema en
// accounts: el generador de OpenAPI no debe ver el schema transformado.
export const WishlistMembershipQuerySchema = z.object({
  productIds: z
    .string()
    .transform((value) =>
      value
        .split(",")
        .map((id) => id.trim())
        .filter((id) => id.length > 0),
    )
    .pipe(z.array(z.string().uuid()).min(1).max(MAX_MEMBERSHIP_PRODUCT_IDS)),
});

const WishlistMembershipQueryBodySchema = z.object({
  productIds: z.string().openapi({
    example: "0f2a9c9e-8b1a-7c1a-9c1a-1c1e1e1e1e1e,1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d",
    description: `Lista de productId separados por coma (máximo ${MAX_MEMBERSHIP_PRODUCT_IDS}).`,
  }),
});

export const WishlistMembershipResponseSchema = z.object({
  productIds: z.array(z.string().uuid()),
});

registry.registerPath({
  method: "get",
  path: "/wishlist/membership",
  tags: ["wishlist"],
  summary: "Indica cuáles de los productIds dados están en la lista de deseos del usuario autenticado",
  request: { query: WishlistMembershipQueryBodySchema },
  responses: {
    200: {
      description: "Subconjunto de los productIds dados que está en la lista de deseos.",
      content: { "application/json": { schema: WishlistMembershipResponseSchema } },
    },
    400: { description: "productIds inválido, vacío o excede el máximo permitido." },
    401: { description: "No autenticado." },
  },
  security: [{ bearerAuth: [] }],
});
