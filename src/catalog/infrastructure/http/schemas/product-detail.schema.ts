import { z } from "zod";
import { registry } from "../../../../shared-kernel/infrastructure/swagger/registry";
import { StockStatus } from "../../../domain/enums/StockStatus";
import { ProductRatingSchema } from "./list-products.schema";

export const ProductSlugParamsSchema = z.object({
  slug: z.string().min(1),
});

export const ProductDetailVariantSchema = z.object({
  id: z.string().uuid(),
  sku: z.string().openapi({ example: "SH-ARG-500" }),
  size: z.string().nullable().openapi({ example: "500ml" }),
  scent: z.string().nullable(),
  color: z.string().nullable(),
  price: z.number().openapi({ example: 45000 }),
  stockQuantity: z.number(),
  stockStatus: z.nativeEnum(StockStatus),
  imageUrl: z.string().nullable(),
});

export const ProductDetailResponseSchema = z.object({
  id: z.string().uuid(),
  slug: z.string(),
  name: z.string(),
  description: z.string(),
  brand: z.string().nullable(),
  ingredients: z.string().nullable(),
  attributes: z.record(z.string()),
  images: z.array(z.string()),
  basePrice: z.number(),
  compareAtPrice: z.number().nullable(),
  variants: z.array(ProductDetailVariantSchema),
  rating: ProductRatingSchema,
});

registry.registerPath({
  method: "get",
  path: "/products/{slug}",
  tags: ["catalog"],
  summary: "Detalle de un producto por slug, con variantes, precios, imágenes y stock",
  request: { params: ProductSlugParamsSchema },
  responses: {
    200: {
      description: "Detalle del producto.",
      content: { "application/json": { schema: ProductDetailResponseSchema } },
    },
    404: { description: "No se encontró el producto." },
  },
});
