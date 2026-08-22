import { z } from "zod";
import { registry } from "../../../../shared-kernel/infrastructure/swagger/registry";

export const AutocompleteQuerySchema = z.object({
  q: z.string().min(1),
});

export const AutocompleteSuggestionSchema = z.object({
  id: z.string().uuid(),
  slug: z.string(),
  name: z.string(),
  thumbnailUrl: z.string().nullable(),
});

export const AutocompleteResponseSchema = z.object({
  suggestions: z.array(AutocompleteSuggestionSchema),
});

registry.registerPath({
  method: "get",
  path: "/products/search/suggestions",
  tags: ["catalog"],
  summary: "Sugerencias de autocompletado de productos mientras el usuario escribe",
  request: { query: AutocompleteQuerySchema },
  responses: {
    200: {
      description: "Hasta 8 sugerencias por nombre de producto.",
      content: { "application/json": { schema: AutocompleteResponseSchema } },
    },
  },
});
