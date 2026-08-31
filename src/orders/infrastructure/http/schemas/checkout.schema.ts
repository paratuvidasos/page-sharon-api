import { z } from "zod";
import { Currency } from "../../../../shared-kernel/domain/enums/Currency";
import { PaymentMethod } from "../../../../shared-kernel/domain/enums/PaymentMethod";
import { registry } from "../../../../shared-kernel/infrastructure/swagger/registry";
import { validatePhoneForCountry } from "../../../../accounts/infrastructure/http/validation/phone";
import {
  SUPPORTED_ADDRESS_COUNTRY_CODES,
  validatePostalCodeForCountry,
} from "../../../../accounts/infrastructure/http/validation/postal-code";
import { OrderStatus } from "../../../domain/enums/OrderStatus";

const PASSWORD_PATTERN = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;

/**
 * Lo que el cliente puede decidir de una línea es qué variante y cuántas.
 * `expectedUnitPrice` es opcional y **no se cobra**: solo sirve para que el
 * servidor detecte que el precio cambió desde que se pintó el carrito y corte
 * el checkout en vez de cobrar un precio distinto al que se vio ([0038]).
 */
const CheckoutItemRequestSchema = z.object({
  variantId: z.string().uuid(),
  quantity: z.number().int().positive().openapi({ example: 2 }),
  expectedUnitPrice: z.number().nonnegative().optional().openapi({ example: 45900 }),
});

export const CheckoutShippingAddressSchema = z
  .object({
    recipientName: z.string().min(1).max(150).openapi({ example: "Sharon Gómez" }),
    phone: z.string().min(1).max(30).openapi({ example: "+573001234567" }),
    countryCode: z.enum(SUPPORTED_ADDRESS_COUNTRY_CODES).openapi({ example: "CO" }),
    stateProvince: z.string().min(1).max(100).openapi({ example: "Cundinamarca" }),
    city: z.string().min(1).max(100).openapi({ example: "Bogotá" }),
    postalCode: z.string().min(1).max(20).openapi({ example: "110111" }),
    streetLine1: z.string().min(1).max(200).openapi({ example: "Calle 123 #45-67" }),
    streetLine2: z.string().max(200).nullable().optional().openapi({ example: "Apto 501" }),
  })
  // [0033]: la validación por país reutiliza tal cual las reglas que ya usa
  // la libreta de direcciones de `accounts`, para que una dirección escrita
  // en el checkout se valide igual que una guardada desde el perfil.
  .superRefine((data, ctx) => {
    validatePostalCodeForCountry(ctx, data.postalCode, data.countryCode);
    validatePhoneForCountry(ctx, data.phone, data.countryCode);
  });

// Las reglas que dependen del estado de la sesión (que `guestEmail` sea
// obligatorio sin login, que `shippingAddressId` exija usuario autenticado)
// no viven aquí: zod solo valida la forma del body. Esas viven en
// StartCheckout, que sí conoce quién está pidiendo.
export const CheckoutRequestSchema = z
  .object({
    items: z.array(CheckoutItemRequestSchema).min(1),
    shippingAddressId: z.string().uuid().optional().openapi({
      description: "Id de una dirección guardada del usuario. Alternativo a `shippingAddress`.",
    }),
    shippingAddress: CheckoutShippingAddressSchema.optional(),
    shippingMethod: z.string().min(1).max(30).openapi({ example: "STANDARD" }),
    couponCode: z.string().min(1).max(40).nullable().optional().openapi({ example: "BIENVENIDA10" }),
    currency: z.nativeEnum(Currency).default(Currency.COP),
    paymentMethod: z.nativeEnum(PaymentMethod),
    paymentMethodLabel: z.string().max(100).nullable().optional().openapi({ example: "Tarjeta de crédito" }),
    documentNumber: z.string().max(30).nullable().optional().openapi({
      example: "1020304050",
      description: "Documento del pagador. Bold lo pide para algunos métodos como PSE.",
    }),
    // Se normaliza a minúsculas: es la llave con la que un invitado
    // recupera su pedido, y con la que se reconoce como suyo al iniciar
    // sesión. Guardarlo tal cual lo escribieron haría que "Ana@..." y
    // "ana@..." fueran dos personas distintas.
    guestEmail: z.string().email().max(255).toLowerCase().optional().openapi({ example: "ana@example.com" }),
    createAccount: z.boolean().optional().default(false),
    firstName: z.string().min(1).max(100).optional().openapi({ example: "Ana" }),
    lastName: z.string().min(1).max(100).optional().openapi({ example: "Ruiz" }),
    password: z
      .string()
      .regex(PASSWORD_PATTERN, "La contraseña debe tener al menos 8 caracteres, con letras y números.")
      .optional(),
  })
  .refine((data) => Boolean(data.shippingAddressId) !== Boolean(data.shippingAddress), {
    message: "Envía shippingAddressId (dirección guardada) o shippingAddress (nueva), pero no ambos.",
    path: ["shippingAddress"],
  })
  .refine(
    (data) =>
      !data.createAccount || Boolean(data.guestEmail && data.firstName && data.lastName && data.password),
    {
      message: "createAccount requiere guestEmail, firstName, lastName y password.",
      path: ["createAccount"],
    },
  );

export type CheckoutRequest = z.infer<typeof CheckoutRequestSchema>;

const OrderLineResponseSchema = z.object({
  productId: z.string().uuid(),
  variantId: z.string().uuid(),
  productName: z.string(),
  sku: z.string(),
  unitPrice: z.number(),
  quantity: z.number().int(),
  lineTotal: z.number(),
});

const ResponseShippingAddressSchema = z.object({
  recipientName: z.string(),
  phone: z.string(),
  countryCode: z.string(),
  stateProvince: z.string(),
  city: z.string(),
  postalCode: z.string(),
  streetLine1: z.string(),
  streetLine2: z.string().nullable(),
});

/** [0047]: guía y transportadora, una vez despachado el pedido. */
export const OrderShipmentResponseSchema = z.object({
  carrierCode: z.string().openapi({ example: "SERVIENTREGA" }),
  carrierName: z.string().openapi({ example: "Servientrega" }),
  trackingNumber: z.string().openapi({ example: "1234567890" }),
  trackingUrl: z.string().nullable().openapi({
    example: "https://www.servientrega.com/rastreo/1234567890",
    description: "Enlace de rastreo externo, si la transportadora lo provee.",
  }),
  shippedAt: z.string().datetime(),
  deliveredAt: z.string().datetime().nullable(),
});

/** [0043]: cada cambio de estado con su fecha, del más antiguo al más reciente. */
export const OrderStatusChangeResponseSchema = z.object({
  status: z.nativeEnum(OrderStatus),
  changedAt: z.string().datetime(),
  note: z.string().nullable().openapi({
    example: "1234567890",
    description: "Detalle del cambio: número de guía, motivo del rechazo, etc.",
  }),
  changedByAdminLabel: z.string().nullable().optional().openapi({
    example: "admin@sharon.com",
    description:
      "[0060]: email del admin que hizo el cambio, null en transiciones del sistema. Solo se expone en los endpoints del panel administrativo — el detalle de pedido del cliente lo omite.",
  }),
});

export const OrderSummaryResponseSchema = z.object({
  id: z.string().uuid(),
  orderNumber: z.string().openapi({ example: "ORD-20260824-AB12CD" }),
  status: z.nativeEnum(OrderStatus),
  currency: z.nativeEnum(Currency),
  exchangeRate: z.number().openapi({
    example: 1,
    description: "Tasa contra la moneda base, congelada al momento de la compra ([0041]).",
  }),
  items: z.array(OrderLineResponseSchema),
  subtotal: z.number(),
  couponCode: z.string().nullable(),
  discount: z.number(),
  shippingCost: z.number(),
  shippingMethodCode: z.string(),
  shippingMethodLabel: z.string(),
  total: z.number(),
  paymentMethod: z.nativeEnum(PaymentMethod),
  paymentMethodLabel: z.string().nullable(),
  paymentFailureMessage: z.string().nullable(),
  shippingAddress: ResponseShippingAddressSchema,
  shipment: OrderShipmentResponseSchema.nullable(),
  statusHistory: z.array(OrderStatusChangeResponseSchema),
  placedAt: z.string().datetime(),
  paidAt: z.string().datetime().nullable(),
});

/**
 * Parámetros ya firmados para abrir la pasarela. El frontend los pasa tal
 * cual a los `data-*` del botón de Bold: si recalcula el monto por su cuenta,
 * la firma deja de coincidir y Bold rechaza la transacción.
 */
export const PaymentSessionResponseSchema = z.object({
  attemptId: z.string().uuid(),
  referenceId: z.string().openapi({ example: "ORD-20260824-AB12CD-9F3E7A21" }),
  expiresAt: z.string().datetime(),
  session: z.object({
    provider: z.string().openapi({ example: "BOLD" }),
    scriptUrl: z.string().openapi({
      example: "https://checkout.bold.co/library/boldPaymentButton.js",
      description: "Vacío cuando corre la pasarela simulada local (sin credenciales de Bold).",
    }),
    apiKey: z.string(),
    referenceId: z.string(),
    amount: z.number(),
    currency: z.nativeEnum(Currency),
    integritySignature: z.string(),
    description: z.string(),
    redirectionUrl: z.string(),
    expirationDate: z.string().openapi({ description: "Nanosegundos desde epoch, el formato de Bold." }),
    customerData: z.string(),
    billingAddress: z.string(),
    renderMode: z.string().openapi({ example: "embedded" }),
    sandbox: z.boolean(),
  }),
});

const CheckoutAccountResponseSchema = z.object({
  accessToken: z.string(),
  expiresIn: z.number().int(),
  user: z.object({
    id: z.string().uuid(),
    email: z.string().email(),
    firstName: z.string(),
    lastName: z.string(),
    role: z.string(),
  }),
});

export const CheckoutResponseSchema = z.object({
  order: OrderSummaryResponseSchema,
  payment: PaymentSessionResponseSchema,
  account: CheckoutAccountResponseSchema.nullable(),
});

registry.registerPath({
  method: "post",
  path: "/orders/checkout",
  tags: ["orders"],
  summary: "Confirma el pedido, aparta el stock y devuelve los parámetros firmados de la pasarela",
  description:
    "Revalida stock y precio contra el catálogo, recotiza el envío y revalida el cupón en el servidor: los montos que llegan en el body se ignoran. El pedido queda en PENDING hasta que la pasarela confirme el cobro por webhook.",
  request: {
    body: { content: { "application/json": { schema: CheckoutRequestSchema } } },
  },
  responses: {
    201: {
      description:
        "Pedido creado y sesión de pago lista. Si se pidió crear cuenta, incluye el token de la sesión recién iniciada.",
      content: { "application/json": { schema: CheckoutResponseSchema } },
    },
    400: { description: "Datos inválidos, pedido sin ítems, o falta el correo de invitado." },
    409: {
      description:
        "El precio cambió (CHECKOUT_PRICE_CHANGED), no hay stock suficiente (CHECKOUT_ITEM_UNAVAILABLE o VARIANT_OUT_OF_STOCK), o el correo ya tiene cuenta.",
    },
    422: {
      description:
        "Sin cobertura de envío, método de envío o de pago no disponible, o moneda no soportada.",
    },
  },
});
