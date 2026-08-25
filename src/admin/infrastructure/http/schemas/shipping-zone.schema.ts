import { z } from "zod";
import { Currency } from "../../../../shared-kernel/domain/enums/Currency";
import {
  paginatedResponseSchema,
  PaginationQuerySchema,
} from "../../../../shared-kernel/infrastructure/http/pagination";
import { registry } from "../../../../shared-kernel/infrastructure/swagger/registry";
import { ShippingMethod } from "../../../../shipping/domain/enums/ShippingMethod";

/**
 * [0049]: contrato del panel de configuración de zonas.
 *
 * Los enums salen del dominio de `shipping` (`z.nativeEnum`), no de una lista
 * copiada a mano: así Swagger muestra siempre los métodos que existen de
 * verdad (ver sección "Enums" del CLAUDE.md del repo).
 */
const ZoneRateSchema = z.object({
  method: z.nativeEnum(ShippingMethod),
  label: z.string().min(1).max(100).openapi({ example: "Envío estándar" }),
  cost: z.number().nonnegative().openapi({ example: 9900 }),
  currency: z.nativeEnum(Currency).default(Currency.COP),
  estimatedMinDays: z.number().int().nonnegative().openapi({ example: 3 }),
  estimatedMaxDays: z.number().int().nonnegative().openapi({ example: 5 }),
  freeShippingThreshold: z.number().nonnegative().nullable().default(null).openapi({
    example: 150000,
    description: "Subtotal desde el cual esta tarifa queda en cero. null = nunca es gratis.",
  }),
  isActive: z.boolean().default(true),
});

const CoverageFieldsSchema = {
  name: z.string().min(1).max(100).openapi({ example: "Bogotá y Cundinamarca" }),
  stateProvinces: z.array(z.string().min(1).max(100)).nullable().default(null).openapi({
    example: ["Cundinamarca"],
    description: "null o lista vacía = la zona cubre el país entero.",
  }),
  postalCodePatterns: z.array(z.string().min(1).max(20)).nullable().default(null).openapi({
    example: ["110%", "250%"],
    description:
      "Patrones LIKE de código postal. null o lista vacía = no se filtra por código postal.",
  }),
  priority: z.number().int().nonnegative().default(0).openapi({
    example: 10,
    description: "Entre dos zonas que cubren el mismo destino gana la de mayor prioridad.",
  }),
  isActive: z.boolean().default(true),
};

export const CreateShippingZoneRequestSchema = z.object({
  ...CoverageFieldsSchema,
  countryCode: z.string().length(2).toUpperCase().openapi({ example: "CO" }),
  rates: z.array(ZoneRateSchema).min(1).openapi({
    description: "Una zona sin tarifas no cotiza nada, así que se exige al menos una.",
  }),
});

/**
 * El país no se puede cambiar: mover una zona de país le cambiaría el costo a
 * todo un mercado sin dejar rastro de la decisión. Para eso se crea otra zona.
 */
export const UpdateShippingZoneRequestSchema = z.object({
  name: CoverageFieldsSchema.name.optional(),
  stateProvinces: z.array(z.string().min(1).max(100)).nullable().optional(),
  postalCodePatterns: z.array(z.string().min(1).max(20)).nullable().optional(),
  priority: z.number().int().nonnegative().optional(),
  isActive: z.boolean().optional(),
  rates: z.array(ZoneRateSchema).min(1).optional(),
});

export const SetZoneRestrictionsRequestSchema = z.object({
  restrictions: z
    .array(
      z.object({
        productId: z.string().uuid(),
        reason: z.string().max(200).nullable().default(null).openapi({
          example: "No se puede importar por regulación de aduana.",
        }),
      }),
    )
    .openapi({
      description: "Set completo de restricciones de la zona: lo que no venga acá queda permitido.",
    }),
});

export const ShippingZoneParamsSchema = z.object({ id: z.string().uuid() });

export const ShippingZoneResponseSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  countryCode: z.string(),
  stateProvinces: z.array(z.string()).nullable(),
  postalCodePatterns: z.array(z.string()).nullable(),
  priority: z.number().int(),
  isActive: z.boolean(),
  rates: z.array(
    ZoneRateSchema.extend({ currency: z.nativeEnum(Currency), isActive: z.boolean() }),
  ),
  restrictedProducts: z.array(
    z.object({ productId: z.string().uuid(), reason: z.string().nullable() }),
  ),
});

export const ShippingZoneListResponseSchema = paginatedResponseSchema(ShippingZoneResponseSchema);
export const ShippingZoneListQuerySchema = PaginationQuerySchema;

export const CreateShippingZoneResponseSchema = z.object({ id: z.string().uuid() });

registry.registerPath({
  method: "get",
  path: "/admin/shipping/zones",
  tags: ["admin"],
  summary: "Lista las zonas de cobertura de envío (solo administradores)",
  security: [{ bearerAuth: [] }],
  request: { query: ShippingZoneListQuerySchema },
  responses: {
    200: {
      description: "Página de zonas, de mayor a menor prioridad.",
      content: { "application/json": { schema: ShippingZoneListResponseSchema } },
    },
    403: { description: "El usuario no es administrador." },
  },
});

registry.registerPath({
  method: "post",
  path: "/admin/shipping/zones",
  tags: ["admin"],
  summary: "Crea una zona de cobertura de envío (solo administradores)",
  description:
    "La zona puede definirse por país, por departamento o por código postal. Los criterios se acumulan: una zona con departamentos y códigos postales exige que el destino cumpla ambos.",
  security: [{ bearerAuth: [] }],
  request: {
    body: { content: { "application/json": { schema: CreateShippingZoneRequestSchema } } },
  },
  responses: {
    201: {
      description: "Zona creada.",
      content: { "application/json": { schema: CreateShippingZoneResponseSchema } },
    },
    400: { description: "La configuración de la zona no es válida." },
  },
});

registry.registerPath({
  method: "patch",
  path: "/admin/shipping/zones/{id}",
  tags: ["admin"],
  summary: "Edita una zona de cobertura (solo administradores)",
  security: [{ bearerAuth: [] }],
  request: {
    params: ShippingZoneParamsSchema,
    body: { content: { "application/json": { schema: UpdateShippingZoneRequestSchema } } },
  },
  responses: {
    204: { description: "Zona actualizada." },
    400: { description: "La configuración de la zona no es válida." },
    404: { description: "La zona no existe." },
  },
});

registry.registerPath({
  method: "delete",
  path: "/admin/shipping/zones/{id}",
  tags: ["admin"],
  summary: "Elimina una zona de cobertura (solo administradores)",
  description:
    "Se borran también sus tarifas y restricciones. Los pedidos ya colocados no se ven afectados: guardan un snapshot del método de envío, no una referencia a la tarifa.",
  security: [{ bearerAuth: [] }],
  request: { params: ShippingZoneParamsSchema },
  responses: {
    204: { description: "Zona eliminada." },
    404: { description: "La zona no existe." },
  },
});

registry.registerPath({
  method: "put",
  path: "/admin/shipping/zones/{id}/restrictions",
  tags: ["admin"],
  summary: "Define qué productos no se pueden enviar a una zona (solo administradores)",
  description:
    "El checkout rechaza con 422 PRODUCTS_RESTRICTED_FOR_ZONE cualquier pedido que incluya uno de estos productos con destino a esta zona.",
  security: [{ bearerAuth: [] }],
  request: {
    params: ShippingZoneParamsSchema,
    body: { content: { "application/json": { schema: SetZoneRestrictionsRequestSchema } } },
  },
  responses: {
    204: { description: "Restricciones actualizadas." },
    404: { description: "La zona no existe." },
  },
});
