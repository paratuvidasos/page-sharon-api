import { z } from "zod";
import { registry } from "../../../../shared-kernel/infrastructure/swagger/registry";
import { OrderStatus } from "../../../domain/enums/OrderStatus";
import { PaymentMethod } from "../../../domain/enums/PaymentMethod";

const PASSWORD_PATTERN = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;

const CheckoutItemRequestSchema = z.object({
  productId: z.string().uuid(),
  productName: z.string().min(1).max(200).openapi({ example: "Shampoo reparador 400ml" }),
  sku: z.string().min(1).max(50).openapi({ example: "SH-REP-400" }),
  unitPrice: z.number().nonnegative().openapi({ example: 45900 }),
  quantity: z.number().int().positive().openapi({ example: 2 }),
});

const CheckoutShippingAddressSchema = z.object({
  recipientName: z.string().min(1).max(150).openapi({ example: "Sharon Gómez" }),
  phone: z.string().min(1).max(30).openapi({ example: "+573001234567" }),
  countryCode: z.string().length(2).openapi({ example: "CO" }),
  stateProvince: z.string().min(1).max(100).openapi({ example: "Cundinamarca" }),
  city: z.string().min(1).max(100).openapi({ example: "Bogotá" }),
  postalCode: z.string().min(1).max(20).openapi({ example: "110111" }),
  streetLine1: z.string().min(1).max(200).openapi({ example: "Calle 123 #45-67" }),
  streetLine2: z.string().max(200).nullable().optional().openapi({ example: "Apto 501" }),
});

// La regla "guestEmail es obligatorio si no hay sesión iniciada" no vive
// aquí: zod solo valida la forma del body, no el estado de auth que resuelve
// el middleware. Esa regla vive en PlaceOrder (GuestEmailRequiredException).
export const CheckoutRequestSchema = z
  .object({
    items: z.array(CheckoutItemRequestSchema).min(1),
    shippingCost: z.number().nonnegative().openapi({ example: 9900 }),
    paymentMethod: z.nativeEnum(PaymentMethod),
    paymentMethodLabel: z.string().max(100).nullable().optional().openapi({ example: "Contraentrega" }),
    shippingAddress: CheckoutShippingAddressSchema,
    guestEmail: z.string().email().max(255).optional().openapi({ example: "ana@example.com" }),
    createAccount: z.boolean().optional().default(false),
    firstName: z.string().min(1).max(100).optional().openapi({ example: "Ana" }),
    lastName: z.string().min(1).max(100).optional().openapi({ example: "Ruiz" }),
    password: z
      .string()
      .regex(PASSWORD_PATTERN, "La contraseña debe tener al menos 8 caracteres, con letras y números.")
      .optional(),
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

const CheckoutLineItemResponseSchema = z.object({
  productId: z.string().uuid(),
  productName: z.string(),
  sku: z.string(),
  unitPrice: z.number(),
  quantity: z.number().int(),
  lineTotal: z.number(),
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
  order: z.object({
    id: z.string().uuid(),
    orderNumber: z.string().openapi({ example: "ORD-20260820-AB12CD" }),
    status: z.nativeEnum(OrderStatus),
    currency: z.string().openapi({ example: "COP" }),
    subtotal: z.number(),
    shippingCost: z.number(),
    total: z.number(),
    paymentMethod: z.nativeEnum(PaymentMethod),
    paymentMethodLabel: z.string().nullable(),
    shippingAddress: CheckoutShippingAddressSchema,
    items: z.array(CheckoutLineItemResponseSchema),
    placedAt: z.string().datetime(),
  }),
  account: CheckoutAccountResponseSchema.nullable(),
});

registry.registerPath({
  method: "post",
  path: "/orders/checkout",
  tags: ["orders"],
  summary:
    "Completa una compra, como invitado o con sesión iniciada, con la opción de crear cuenta en el mismo paso",
  request: {
    body: {
      content: { "application/json": { schema: CheckoutRequestSchema } },
    },
  },
  responses: {
    201: {
      description:
        "Pedido creado. Si se pidió crear cuenta, incluye el token de acceso de la sesión recién iniciada.",
      content: { "application/json": { schema: CheckoutResponseSchema } },
    },
    400: { description: "Datos de entrada inválidos, pedido sin ítems, o falta el correo de invitado." },
    409: { description: "El correo ya tiene una cuenta registrada (al pedir createAccount)." },
  },
});
