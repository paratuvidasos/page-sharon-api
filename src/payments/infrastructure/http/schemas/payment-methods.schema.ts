import { z } from "zod";
import { Currency } from "../../../../shared-kernel/domain/enums/Currency";
import { PaymentMethod } from "../../../../shared-kernel/domain/enums/PaymentMethod";
import { registry } from "../../../../shared-kernel/infrastructure/swagger/registry";

export const ListPaymentMethodsQuerySchema = z.object({
  countryCode: z.string().length(2).toUpperCase().default("CO").openapi({ example: "CO" }),
  currency: z.nativeEnum(Currency).default(Currency.COP),
});

export const PaymentMethodsResponseSchema = z.object({
  countryCode: z.string().openapi({ example: "CO" }),
  currency: z.nativeEnum(Currency),
  methods: z.array(
    z.object({
      method: z.nativeEnum(PaymentMethod),
      label: z.string().openapi({ example: "PSE" }),
      description: z.string().openapi({ example: "Débito desde tu cuenta bancaria." }),
    }),
  ),
});

registry.registerPath({
  method: "get",
  path: "/payments/methods",
  tags: ["payments"],
  summary: "Lista los métodos de pago habilitados para un país y una moneda",
  description:
    "Qué métodos puede procesar el comercio lo define el panel de Bold; esta lista es la que se pinta en el checkout.",
  request: { query: ListPaymentMethodsQuerySchema },
  responses: {
    200: {
      description: "Métodos de pago disponibles.",
      content: { "application/json": { schema: PaymentMethodsResponseSchema } },
    },
  },
});
