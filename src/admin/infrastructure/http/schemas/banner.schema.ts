import { z } from "zod";
import { registry } from "../../../../shared-kernel/infrastructure/swagger/registry";

export const CreateBannerRequestSchema = z.object({
  imageUrl: z.string().url().openapi({ description: "URL devuelta por POST /admin/banners/upload-image." }),
  linkUrl: z.string().url().nullable().optional(),
  title: z.string().min(1).max(150),
  startsAt: z.coerce.date().nullable().optional(),
  endsAt: z.coerce.date().nullable().optional(),
  isActive: z.boolean().optional(),
});

export const UpdateBannerRequestSchema = z.object({
  imageUrl: z.string().url().optional(),
  linkUrl: z.string().url().nullable().optional(),
  title: z.string().min(1).max(150).optional(),
  startsAt: z.coerce.date().nullable().optional(),
  endsAt: z.coerce.date().nullable().optional(),
  isActive: z.boolean().optional(),
});

export const ReorderBannersRequestSchema = z.object({
  bannerIds: z.array(z.string().uuid()).openapi({
    description: "Lista ordenada completa de ids de banners (el orden define sortOrder).",
  }),
});

export const BannerParamsSchema = z.object({ id: z.string().uuid() });

export const BannerAdminResponseSchema = z.object({
  id: z.string().uuid(),
  imageUrl: z.string().url(),
  linkUrl: z.string().url().nullable(),
  title: z.string(),
  sortOrder: z.number().int(),
  startsAt: z.coerce.date().nullable(),
  endsAt: z.coerce.date().nullable(),
  isActive: z.boolean(),
});

export const ListBannersAdminResponseSchema = z.object({ items: z.array(BannerAdminResponseSchema) });
export const CreateBannerResponseSchema = z.object({ id: z.string().uuid() });
export const UploadBannerImageResponseSchema = z.object({ url: z.string().url() });

registry.registerPath({
  method: "get",
  path: "/admin/banners",
  tags: ["admin"],
  summary: "Lista todos los banners, incluidos inactivos y programados (solo administradores)",
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: "Todos los banners, en el orden configurado.",
      content: { "application/json": { schema: ListBannersAdminResponseSchema } },
    },
  },
});

registry.registerPath({
  method: "post",
  path: "/admin/banners",
  tags: ["admin"],
  summary: "Crea un banner (solo administradores)",
  security: [{ bearerAuth: [] }],
  request: { body: { content: { "application/json": { schema: CreateBannerRequestSchema } } } },
  responses: {
    201: {
      description: "Banner creado.",
      content: { "application/json": { schema: CreateBannerResponseSchema } },
    },
    400: { description: "El banner no es válido." },
  },
});

registry.registerPath({
  method: "patch",
  path: "/admin/banners/{id}",
  tags: ["admin"],
  summary: "Edita un banner (solo administradores)",
  security: [{ bearerAuth: [] }],
  request: {
    params: BannerParamsSchema,
    body: { content: { "application/json": { schema: UpdateBannerRequestSchema } } },
  },
  responses: {
    204: { description: "Banner actualizado." },
    400: { description: "El banner no es válido." },
    404: { description: "El banner no existe." },
  },
});

registry.registerPath({
  method: "delete",
  path: "/admin/banners/{id}",
  tags: ["admin"],
  summary: "Elimina un banner (solo administradores)",
  security: [{ bearerAuth: [] }],
  request: { params: BannerParamsSchema },
  responses: {
    204: { description: "Banner eliminado." },
    404: { description: "El banner no existe." },
  },
});

registry.registerPath({
  method: "put",
  path: "/admin/banners/order",
  tags: ["admin"],
  summary: "Reordena los banners (solo administradores)",
  description: "Recibe la lista ordenada completa — lo que no venga acá no se reordena.",
  security: [{ bearerAuth: [] }],
  request: { body: { content: { "application/json": { schema: ReorderBannersRequestSchema } } } },
  responses: {
    204: { description: "Orden actualizado." },
    400: { description: "Alguno de los banners indicados no existe." },
  },
});

registry.registerPath({
  method: "post",
  path: "/admin/banners/upload-image",
  tags: ["admin"],
  summary: "Sube la imagen de un banner y devuelve su URL (solo administradores)",
  description: "multipart/form-data, campo \"image\" (JPG/PNG/WEBP).",
  security: [{ bearerAuth: [] }],
  responses: {
    201: {
      description: "Imagen subida.",
      content: { "application/json": { schema: UploadBannerImageResponseSchema } },
    },
    400: { description: "El archivo no es una imagen válida." },
  },
});
