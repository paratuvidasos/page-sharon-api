import { z } from "zod";
import { Currency } from "../../../../shared-kernel/domain/enums/Currency";
import { registry } from "../../../../shared-kernel/infrastructure/swagger/registry";
import { ShippingMethod } from "../../../domain/enums/ShippingMethod";

export const ShippingQuoteRequestSchema = z.object({
  countryCode: z.string().length(2).toUpperCase().openapi({ example: "CO" }),
  stateProvince: z.string().min(1).max(100).openapi({ example: "Cundinamarca" }),
  subtotal: z.number().nonnegative().openapi({
    example: 120000,
    description: "Subtotal del pedido ya con el descuento del cupón aplicado.",
  }),
  currency: z.nativeEnum(Currency).default(Currency.COP),
});

export type ShippingQuoteRequest = z.infer<typeof ShippingQuoteRequestSchema>;

const ShippingOptionSchema = z.object({
  method: z.nativeEnum(ShippingMethod),
  label: z.string().openapi({ example: "Envío estándar" }),
  cost: z.number().openapi({ example: 9900 }),
  currency: z.nativeEnum(Currency),
  estimatedMinDays: z.number().int().openapi({ example: 3 }),
  estimatedMaxDays: z.number().int().openapi({ example: 5 }),
  freeShippingApplied: z.boolean().openapi({
    example: false,
    description: "true cuando el subtotal alcanzó el umbral de envío gratis y el costo quedó en 0.",
  }),
});

export const ShippingQuoteResponseSchema = z.object({
  zoneName: z.string().openapi({ example: "Colombia (nacional)" }),
  currency: z.nativeEnum(Currency),
  options: z.array(ShippingOptionSchema),
});

registry.registerPath({
  method: "post",
  path: "/shipping/quote",
  tags: ["shipping"],
  summary: "Cotiza las opciones de envío disponibles para una dirección de destino",
  description:
    "El costo devuelto aquí es el único válido: el checkout lo vuelve a cotizar en el servidor e ignora cualquier costo que mande el cliente.",
  request: {
    body: { content: { "application/json": { schema: ShippingQuoteRequestSchema } } },
  },
  responses: {
    200: {
      description: "Opciones de envío con costo y tiempo estimado.",
      content: { "application/json": { schema: ShippingQuoteResponseSchema } },
    },
    400: { description: "Datos de entrada inválidos." },
    422: { description: "No hay cobertura de envío para la dirección indicada." },
  },
});
