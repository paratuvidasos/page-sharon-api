import { z } from "zod";
import {
  SUPPORTED_ADDRESS_COUNTRY_CODES,
  validatePostalCodeForCountry,
} from "../../../../accounts/infrastructure/http/validation/postal-code";
import { Currency } from "../../../../shared-kernel/domain/enums/Currency";
import { registry } from "../../../../shared-kernel/infrastructure/swagger/registry";
import { ShippingMethod } from "../../../domain/enums/ShippingMethod";

/**
 * [0042]: la calculadora del carrito y de la ficha de producto cotiza con lo
 * poco que el comprador quiera escribir — país y código postal, o país y
 * departamento — mientras que el checkout manda siempre los tres datos.
 *
 * El país es obligatorio y sale de la misma lista que valida las direcciones
 * en `accounts`, para que no se pueda cotizar a un país al que la tienda ni
 * siquiera sabe darle formato de código postal.
 */
export const ShippingQuoteRequestSchema = z
  .object({
    countryCode: z.enum(SUPPORTED_ADDRESS_COUNTRY_CODES).openapi({ example: "CO" }),
    stateProvince: z.string().min(1).max(100).optional().openapi({ example: "Cundinamarca" }),
    postalCode: z.string().min(1).max(20).optional().openapi({
      example: "110111",
      description:
        "[0049]: necesario para resolver zonas definidas por código postal. Sin él, esas zonas no se consideran cubiertas.",
    }),
    subtotal: z.number().nonnegative().default(0).openapi({
      example: 120000,
      description:
        "Subtotal del pedido ya con el descuento del cupón aplicado. Cero desde la ficha de producto, donde todavía no hay carrito.",
    }),
    currency: z.nativeEnum(Currency).default(Currency.COP),
    items: z
      .array(z.object({ variantId: z.string().uuid(), quantity: z.number().int().positive() }))
      .max(100)
      .optional()
      .openapi({
        description:
          "[0048]: qué se piensa comprar. De acá salen el peso y las medidas con las que se le cotiza a la transportadora (leídas del catálogo, nunca de esta petición) y los productos restringidos para la zona, que se informan en `restrictedProducts` sin ser un error: el checkout sí los rechaza. Sin `items` solo se puede devolver la tarifa de respaldo.",
      }),
  })
  .superRefine((data, ctx) => {
    // Solo el país alcanza para una zona nacional, pero no para distinguir
    // entre zonas de un mismo país, que es justo lo que [0049] hizo posible.
    if (!data.stateProvince && !data.postalCode) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Indica al menos el código postal o el departamento/región de destino.",
        path: ["postalCode"],
      });
    }
    if (data.postalCode) {
      validatePostalCodeForCountry(ctx, data.postalCode, data.countryCode);
    }
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
  source: z.enum(["CARRIER", "FALLBACK"]).openapi({
    example: "FALLBACK",
    description:
      "[0048]: CARRIER = precio cotizado en vivo por la transportadora; FALLBACK = tarifa de respaldo configurada a mano (también es lo que se usa si la transportadora falla).",
  }),
  carrierCode: z.string().nullable().openapi({ example: null }),
  carrierName: z.string().nullable().openapi({ example: null }),
});

export const ShippingQuoteResponseSchema = z.object({
  zoneName: z.string().openapi({ example: "Colombia (nacional)" }),
  currency: z.nativeEnum(Currency),
  options: z.array(ShippingOptionSchema),
  restrictedProducts: z.array(
    z.object({
      productId: z.string().uuid(),
      reason: z.string().nullable().openapi({ example: "No se puede importar por aduana." }),
    }),
  ),
});

export const ShippingCoverageResponseSchema = z.object({
  countries: z.array(
    z.object({
      countryCode: z.string().openapi({ example: "CO" }),
      stateProvinces: z.array(z.string()).nullable().openapi({
        example: null,
        description: "null = se cubre el país entero.",
      }),
    }),
  ),
});

registry.registerPath({
  method: "post",
  path: "/shipping/quote",
  tags: ["shipping"],
  summary: "Cotiza costo y tiempo de envío para un destino",
  description:
    "[0042]: sirve tanto a la calculadora del carrito o de la ficha de producto (país + código postal, sin carrito) como al checkout. Mandar `items` es lo que hace que el precio de acá coincida con el del checkout, porque es lo que permite cotizar con la transportadora ([0048]). El costo devuelto acá es el único válido: el checkout lo vuelve a cotizar en el servidor e ignora cualquier costo que mande el cliente.",
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

registry.registerPath({
  method: "get",
  path: "/shipping/coverage",
  tags: ["shipping"],
  summary: "Países y regiones a los que la tienda envía hoy",
  description:
    "[0042]: permite que la calculadora no ofrezca destinos que después responderían 'sin cobertura'. Solo aparecen zonas activas con al menos una tarifa activa.",
  responses: {
    200: {
      description: "Cobertura vigente.",
      content: { "application/json": { schema: ShippingCoverageResponseSchema } },
    },
  },
});
