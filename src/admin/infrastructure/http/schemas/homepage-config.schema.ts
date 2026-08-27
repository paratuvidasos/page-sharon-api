import { z } from "zod";
import { AutomaticFeaturedRule } from "../../../../content/domain/enums/AutomaticFeaturedRule";
import { FeaturedSelectionMode } from "../../../../content/domain/enums/FeaturedSelectionMode";
import { registry } from "../../../../shared-kernel/infrastructure/swagger/registry";

export const SetHomepageFeaturedConfigRequestSchema = z
  .object({
    mode: z.nativeEnum(FeaturedSelectionMode),
    manualProductIds: z.array(z.string().uuid()).optional(),
    automaticRule: z.nativeEnum(AutomaticFeaturedRule).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.mode === FeaturedSelectionMode.MANUAL && (!data.manualProductIds || data.manualProductIds.length === 0)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "El modo MANUAL necesita al menos un producto elegido.",
        path: ["manualProductIds"],
      });
    }
    if (data.mode === FeaturedSelectionMode.AUTOMATIC && !data.automaticRule) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "El modo AUTOMATIC necesita una regla.",
        path: ["automaticRule"],
      });
    }
  });

export const HomepageFeaturedConfigResponseSchema = z.object({
  mode: z.nativeEnum(FeaturedSelectionMode),
  manualProductIds: z.array(z.string().uuid()),
  automaticRule: z.nativeEnum(AutomaticFeaturedRule),
});

registry.registerPath({
  method: "get",
  path: "/admin/homepage/featured-config",
  tags: ["admin"],
  summary: "Configuración vigente de destacados de home (solo administradores)",
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: "Configuración actual.",
      content: { "application/json": { schema: HomepageFeaturedConfigResponseSchema } },
    },
  },
});

registry.registerPath({
  method: "put",
  path: "/admin/homepage/featured-config",
  tags: ["admin"],
  summary: "Configura los destacados de home: manuales o automáticos (solo administradores)",
  security: [{ bearerAuth: [] }],
  request: {
    body: { content: { "application/json": { schema: SetHomepageFeaturedConfigRequestSchema } } },
  },
  responses: {
    204: { description: "Configuración actualizada." },
    400: { description: "La configuración no es válida." },
  },
});
