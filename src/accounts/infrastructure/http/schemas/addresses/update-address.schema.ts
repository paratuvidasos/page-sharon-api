import { z } from "zod";
import { registry } from "../../../../../shared-kernel/infrastructure/swagger/registry";
import { AddressRequestBodySchema, buildAddressRequestSchema } from "./address-fields.schema";
import { AddressIdParamsSchema, AddressResponseSchema } from "./address-response.schema";

export const UpdateAddressRequestSchema = buildAddressRequestSchema();

export type UpdateAddressRequest = z.output<typeof UpdateAddressRequestSchema>;

registry.registerPath({
  method: "patch",
  path: "/accounts/me/addresses/{addressId}",
  tags: ["accounts"],
  summary: "Edita una dirección de envío guardada",
  request: {
    params: AddressIdParamsSchema,
    body: {
      content: { "application/json": { schema: AddressRequestBodySchema } },
    },
  },
  responses: {
    200: {
      description: "Dirección actualizada.",
      content: { "application/json": { schema: AddressResponseSchema } },
    },
    400: { description: "Datos inválidos (teléfono, código postal o país no soportado)." },
    401: { description: "No autenticado." },
    404: { description: "La dirección no existe o no pertenece a la cuenta." },
  },
  security: [{ bearerAuth: [] }],
});
