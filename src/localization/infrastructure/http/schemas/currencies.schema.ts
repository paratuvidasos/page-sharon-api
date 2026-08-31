import { z } from "zod";
import { Currency } from "../../../../shared-kernel/domain/enums/Currency";
import { registry } from "../../../../shared-kernel/infrastructure/swagger/registry";

export const SupportedCurrencySchema = z.object({
  code: z.nativeEnum(Currency),
  isBase: z.boolean(),
  rate: z.number().openapi({
    description: "Unidades de esta moneda equivalentes a una de la moneda base.",
    example: 4100,
  }),
});

export const ListSupportedCurrenciesResponseSchema = z.object({
  currencies: z.array(SupportedCurrencySchema),
  base: z.nativeEnum(Currency),
  estimated: z.literal(true).openapi({
    description:
      "La tasa es solo para estimar el precio en pantalla; el cobro real se congela en el checkout con la tasa vigente al momento de la compra.",
  }),
});

registry.registerPath({
  method: "get",
  path: "/localization/currencies",
  tags: ["localization"],
  summary: "Monedas soportadas por la tienda, con la tasa vigente contra la moneda base",
  responses: {
    200: {
      description: "Monedas disponibles para el selector de moneda.",
      content: { "application/json": { schema: ListSupportedCurrenciesResponseSchema } },
    },
  },
});
