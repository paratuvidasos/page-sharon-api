import { z } from "zod";
import { Currency } from "../../../../shared-kernel/domain/enums/Currency";
import { Locale } from "../../../../shared-kernel/domain/enums/Locale";
import { registry } from "../../../../shared-kernel/infrastructure/swagger/registry";

export const PreferenceSourceSchema = z.enum(["ACCOUNT", "COOKIE", "GEOIP", "HEADER", "DEFAULT"]);

export const GetPreferencesResponseSchema = z.object({
  locale: z.nativeEnum(Locale),
  currency: z.nativeEnum(Currency),
  source: PreferenceSourceSchema.openapi({
    description: "De dónde salió el valor: cuenta, cookie ya guardada, geo-IP, cabecera del navegador o el valor por defecto.",
  }),
  detectedCountry: z.string().length(2).nullable().openapi({ example: "CO" }),
});

registry.registerPath({
  method: "get",
  path: "/localization/preferences",
  tags: ["localization"],
  summary: "Idioma/moneda sugeridos o guardados para el visitante actual",
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: "Preferencia resuelta (cuenta > cookie > geo-IP > cabecera > default).",
      content: { "application/json": { schema: GetPreferencesResponseSchema } },
    },
  },
});

export const UpdatePreferencesRequestSchema = z.object({
  locale: z.nativeEnum(Locale).optional(),
  currency: z.nativeEnum(Currency).optional(),
});

registry.registerPath({
  method: "put",
  path: "/localization/preferences",
  tags: ["localization"],
  summary: "Guarda una elección manual de idioma/moneda",
  security: [{ bearerAuth: [] }],
  request: {
    body: { content: { "application/json": { schema: UpdatePreferencesRequestSchema } } },
  },
  responses: {
    204: { description: "Preferencia guardada." },
  },
});
