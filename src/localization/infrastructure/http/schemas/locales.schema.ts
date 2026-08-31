import { z } from "zod";
import { Locale } from "../../../../shared-kernel/domain/enums/Locale";
import { registry } from "../../../../shared-kernel/infrastructure/swagger/registry";

export const SupportedLocaleSchema = z.object({
  code: z.nativeEnum(Locale),
  isDefault: z.boolean(),
});

export const ListSupportedLocalesResponseSchema = z.object({
  locales: z.array(SupportedLocaleSchema),
  default: z.nativeEnum(Locale),
});

registry.registerPath({
  method: "get",
  path: "/localization/locales",
  tags: ["localization"],
  summary: "Idiomas soportados por la tienda",
  responses: {
    200: {
      description: "Idiomas disponibles para el selector de idioma.",
      content: { "application/json": { schema: ListSupportedLocalesResponseSchema } },
    },
  },
});
