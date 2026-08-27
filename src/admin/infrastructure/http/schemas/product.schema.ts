import { z } from "zod";
import { registry } from "../../../../shared-kernel/infrastructure/swagger/registry";

const ParcelDimensionsSchema = z.object({
  weightGrams: z.number().int().nonnegative().optional(),
  lengthCm: z.number().nonnegative().nullable().optional(),
  widthCm: z.number().nonnegative().nullable().optional(),
  heightCm: z.number().nonnegative().nullable().optional(),
});

const CreateVariantFieldsSchema = z.object({
  sku: z.string().min(3).max(50).optional().openapi({
    example: "SHP-RIZ-250",
    description: "Opcional — si no se manda, el backend genera un código único.",
  }),
  size: z.string().max(50).nullable().optional(),
  scent: z.string().max(80).nullable().optional(),
  color: z.string().max(50).nullable().optional(),
  priceOverride: z.number().positive().nullable().optional(),
  stockQuantity: z.number().int().nonnegative(),
  imageUrl: z.string().url().nullable().optional(),
  parcel: ParcelDimensionsSchema.optional(),
});

export const CreateProductRequestSchema = z.object({
  categoryId: z.string().uuid(),
  name: z.string().min(1).max(200).openapi({ example: "Shampoo rizos definidos" }),
  slug: z.string().min(1).max(220).optional().openapi({
    example: "shampoo-rizos-definidos",
    description: "Opcional — si no se manda, el backend lo deriva de \"name\" y verifica que sea único.",
  }),
  description: z.string().min(1),
  brand: z.string().max(120).nullable().optional(),
  ingredients: z.string().nullable().optional(),
  attributes: z.record(z.string(), z.string()).default({}),
  basePrice: z.number().positive().openapi({ example: 45000 }),
  compareAtPrice: z.number().positive().nullable().optional(),
  images: z.array(z.string().url()).default([]),
  variants: z.array(CreateVariantFieldsSchema).min(1),
});

export const UpdateProductRequestSchema = z.object({
  categoryId: z.string().uuid().optional(),
  name: z.string().min(1).max(200).optional(),
  slug: z.string().min(1).max(220).optional(),
  description: z.string().min(1).optional(),
  brand: z.string().max(120).nullable().optional(),
  ingredients: z.string().nullable().optional(),
  attributes: z.record(z.string(), z.string()).optional(),
  basePrice: z.number().positive().optional(),
  compareAtPrice: z.number().positive().nullable().optional(),
  images: z.array(z.string().url()).optional(),
});

export const CreateVariantRequestSchema = CreateVariantFieldsSchema;

export const UpdateVariantRequestSchema = z.object({
  size: z.string().max(50).nullable().optional(),
  scent: z.string().max(80).nullable().optional(),
  color: z.string().max(50).nullable().optional(),
  priceOverride: z.number().positive().nullable().optional(),
  imageUrl: z.string().url().nullable().optional(),
  parcel: ParcelDimensionsSchema.optional(),
});

export const ProductParamsSchema = z.object({ id: z.string().uuid() });
export const ProductVariantParamsSchema = z.object({
  id: z.string().uuid(),
  variantId: z.string().uuid(),
});

export const CreateProductResponseSchema = z.object({ id: z.string().uuid(), slug: z.string() });
export const CreateVariantResponseSchema = z.object({ id: z.string().uuid(), sku: z.string() });
export const DeleteProductResponseSchema = z.object({ archived: z.boolean() });
export const UploadProductImagesResponseSchema = z.object({ images: z.array(z.string().url()) });

registry.registerPath({
  method: "post",
  path: "/admin/products",
  tags: ["admin"],
  summary: "Crea un producto con sus variantes (solo administradores)",
  description:
    "\"slug\" (del producto) y \"sku\" (de cada variante) son opcionales: si no se mandan, el backend los genera y los devuelve en la respuesta.",
  security: [{ bearerAuth: [] }],
  request: { body: { content: { "application/json": { schema: CreateProductRequestSchema } } } },
  responses: {
    201: {
      description: "Producto creado — incluye el slug (el que se mandó, o el generado).",
      content: { "application/json": { schema: CreateProductResponseSchema } },
    },
    400: { description: "El producto no es válido." },
    404: { description: "La categoría indicada no existe." },
    409: { description: "Ya existe una variante con ese SKU." },
  },
});

registry.registerPath({
  method: "patch",
  path: "/admin/products/{id}",
  tags: ["admin"],
  summary: "Edita los campos propios de un producto (solo administradores)",
  security: [{ bearerAuth: [] }],
  request: {
    params: ProductParamsSchema,
    body: { content: { "application/json": { schema: UpdateProductRequestSchema } } },
  },
  responses: {
    204: { description: "Producto actualizado." },
    404: { description: "El producto o la categoría indicada no existen." },
  },
});

registry.registerPath({
  method: "delete",
  path: "/admin/products/{id}",
  tags: ["admin"],
  summary: "Elimina un producto, o lo archiva si tiene pedidos históricos (solo administradores)",
  security: [{ bearerAuth: [] }],
  request: { params: ProductParamsSchema },
  responses: {
    200: {
      description: "`archived: true` si se archivó por tener historial, `false` si se borró de verdad.",
      content: { "application/json": { schema: DeleteProductResponseSchema } },
    },
    404: { description: "El producto no existe." },
  },
});

registry.registerPath({
  method: "post",
  path: "/admin/products/{id}/variants",
  tags: ["admin"],
  summary: "Agrega una variante a un producto (solo administradores)",
  description: "\"sku\" es opcional: si no se manda, el backend genera un código único y lo devuelve en la respuesta.",
  security: [{ bearerAuth: [] }],
  request: {
    params: ProductParamsSchema,
    body: { content: { "application/json": { schema: CreateVariantRequestSchema } } },
  },
  responses: {
    201: {
      description: "Variante creada — incluye el sku (el que se mandó, o el generado).",
      content: { "application/json": { schema: CreateVariantResponseSchema } },
    },
    404: { description: "El producto no existe." },
    409: { description: "Ya existe una variante con ese SKU." },
  },
});

registry.registerPath({
  method: "patch",
  path: "/admin/products/{id}/variants/{variantId}",
  tags: ["admin"],
  summary: "Edita una variante (solo administradores)",
  description: "No incluye el stock — ver [0059] `PATCH /admin/products/{id}/variants/{variantId}/stock`.",
  security: [{ bearerAuth: [] }],
  request: {
    params: ProductVariantParamsSchema,
    body: { content: { "application/json": { schema: UpdateVariantRequestSchema } } },
  },
  responses: {
    204: { description: "Variante actualizada." },
    404: { description: "El producto o la variante no existen." },
  },
});

registry.registerPath({
  method: "delete",
  path: "/admin/products/{id}/variants/{variantId}",
  tags: ["admin"],
  summary: "Elimina una variante de un producto (solo administradores)",
  description: "No se puede eliminar la última variante de un producto.",
  security: [{ bearerAuth: [] }],
  request: { params: ProductVariantParamsSchema },
  responses: {
    204: { description: "Variante eliminada." },
    404: { description: "El producto o la variante no existen." },
    409: { description: "El producto necesita al menos una variante." },
  },
});

registry.registerPath({
  method: "post",
  path: "/admin/products/{id}/images",
  tags: ["admin"],
  summary: "Sube imágenes y las agrega al producto (solo administradores)",
  description: "multipart/form-data, campo \"images\" (hasta 10 archivos JPG/PNG/WEBP).",
  security: [{ bearerAuth: [] }],
  request: { params: ProductParamsSchema },
  responses: {
    201: {
      description: "Imágenes agregadas — devuelve el arreglo completo de imágenes del producto.",
      content: { "application/json": { schema: UploadProductImagesResponseSchema } },
    },
    400: { description: "Algún archivo no es una imagen válida." },
    404: { description: "El producto no existe." },
  },
});
