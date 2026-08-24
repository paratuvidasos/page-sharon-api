import { z } from "zod";
import { registry } from "../../../../shared-kernel/infrastructure/swagger/registry";

export const GetProductFiltersQuerySchema = z.object({
  categoryId: z.string().uuid().optional(),
});

export const FacetOptionSchema = z.object({
  value: z.string(),
  count: z.number(),
});

export const ProductFiltersResponseSchema = z.object({
  hairType: z.array(FacetOptionSchema),
  line: z.array(FacetOptionSchema),
  mainIngredient: z.array(FacetOptionSchema),
  priceRange: z.object({
    min: z.number(),
    max: z.number(),
  }),
});

registry.registerPath({
  method: "get",
  path: "/products/filters",
  tags: ["catalog"],
  summary: "Opciones de filtro disponibles (tipo de cabello, línea, ingrediente, rango de precio) con conteo de resultados",
  request: { query: GetProductFiltersQuerySchema },
  responses: {
    200: {
      description: "Facetas de filtro para el catálogo, opcionalmente acotadas a una categoría.",
      content: { "application/json": { schema: ProductFiltersResponseSchema } },
    },
  },
});
