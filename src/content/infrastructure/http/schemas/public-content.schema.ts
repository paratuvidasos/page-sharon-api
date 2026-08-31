import { z } from "zod";
import { registry } from "../../../../shared-kernel/infrastructure/swagger/registry";

export const PublicBannerResponseSchema = z.object({
  id: z.string().uuid(),
  imageUrl: z.string().url(),
  linkUrl: z.string().url().nullable(),
  title: z.string(),
});

export const ListPublicBannersResponseSchema = z.object({
  items: z.array(PublicBannerResponseSchema),
});

export const FeaturedProductResponseSchema = z.object({
  id: z.string().uuid(),
  slug: z.string(),
  name: z.string(),
  thumbnailUrl: z.string().nullable(),
  basePrice: z.number(),
  compareAtPrice: z.number().nullable(),
});

export const ListFeaturedProductsResponseSchema = z.object({
  items: z.array(FeaturedProductResponseSchema),
});

registry.registerPath({
  method: "get",
  path: "/banners",
  tags: ["content"],
  summary: "Banners vigentes de la home",
  description: "[0066]: solo banners activos y dentro de su ventana de fecha, ordenados por posición.",
  responses: {
    200: {
      description: "Banners a mostrar ahora mismo.",
      content: { "application/json": { schema: ListPublicBannersResponseSchema } },
    },
  },
});

registry.registerPath({
  method: "get",
  path: "/homepage/featured-products",
  tags: ["content"],
  summary: "Productos destacados de la home",
  description: "[0066]: manuales o automáticos (más vendidos/novedades), según la configuración del admin.",
  responses: {
    200: {
      description: "Productos a destacar en la home ahora mismo.",
      content: { "application/json": { schema: ListFeaturedProductsResponseSchema } },
    },
  },
});
