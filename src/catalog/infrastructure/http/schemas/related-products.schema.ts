import { z } from "zod";
import { registry } from "../../../../shared-kernel/infrastructure/swagger/registry";
import { ProductListItemSchema } from "./list-products.schema";
import { ProductSlugParamsSchema } from "./product-detail.schema";

export const RelatedProductsResponseSchema = z.object({
  items: z.array(ProductListItemSchema),
});

registry.registerPath({
  method: "get",
  path: "/products/{slug}/related",
  tags: ["catalog"],
  summary: "Productos relacionados/recomendados de la misma categoría, excluyendo agotados",
  request: { params: ProductSlugParamsSchema },
  responses: {
    200: {
      description: "Hasta 8 productos relacionados.",
      content: { "application/json": { schema: RelatedProductsResponseSchema } },
    },
    404: { description: "No se encontró el producto." },
  },
});
