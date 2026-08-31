import { z } from "zod";
import { Locale } from "../../../../shared-kernel/domain/enums/Locale";
import { registry } from "../../../../shared-kernel/infrastructure/swagger/registry";
import { ProductParamsSchema } from "./product.schema";

const ProductTranslationItemSchema = z.object({
  locale: z.nativeEnum(Locale).openapi({
    description: "El idioma base del catálogo (español) no se traduce a sí mismo — se rechaza.",
  }),
  name: z.string().min(1).max(200),
  description: z.string().min(1),
});

export const SetProductTranslationsRequestSchema = z.object({
  translations: z.array(ProductTranslationItemSchema),
});

registry.registerPath({
  method: "put",
  path: "/admin/products/{id}/translations",
  tags: ["admin"],
  summary: "Reemplaza el set completo de traducciones de un producto",
  security: [{ bearerAuth: [] }],
  request: {
    params: ProductParamsSchema,
    body: { content: { "application/json": { schema: SetProductTranslationsRequestSchema } } },
  },
  responses: {
    204: { description: "Traducciones guardadas." },
    404: { description: "No se encontró el producto." },
  },
});

export const TranslationCoverageItemSchema = z.object({
  locale: z.nativeEnum(Locale),
  translated: z.number().openapi({ example: 12 }),
  total: z.number().openapi({ example: 40 }),
  percentage: z.number().openapi({ example: 30, description: "translated/total, redondeado, 0 si total es 0." }),
});

export const TranslationCoverageResponseSchema = z.object({
  items: z.array(TranslationCoverageItemSchema),
});

registry.registerPath({
  method: "get",
  path: "/admin/products/translation-coverage",
  tags: ["admin"],
  summary: "Porcentaje del catálogo traducido a cada idioma soportado",
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: "Cobertura de traducción por idioma.",
      content: { "application/json": { schema: TranslationCoverageResponseSchema } },
    },
  },
});
