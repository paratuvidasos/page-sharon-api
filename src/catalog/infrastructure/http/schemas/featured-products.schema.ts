import { z } from "zod";
import { registry } from "../../../../shared-kernel/infrastructure/swagger/registry";
import { ProductListItemSchema } from "./list-products.schema";

export const FeaturedProductsResponseSchema = z.object({
  items: z.array(ProductListItemSchema),
});

registry.registerPath({
  method: "get",
  path: "/products/featured",
  tags: ["catalog"],
  summary: "Productos destacados (configurados desde admin) y en oferta, para la sección de la home",
  responses: {
    200: {
      description: "Hasta 20 productos, destacados primero.",
      content: { "application/json": { schema: FeaturedProductsResponseSchema } },
    },
  },
});
