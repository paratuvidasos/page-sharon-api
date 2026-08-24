import { z } from "zod";
import { registry } from "../../../../../shared-kernel/infrastructure/swagger/registry";
import { AddressRequestBodySchema, buildAddressRequestSchema } from "./address-fields.schema";
import { AddressResponseSchema } from "./address-response.schema";

export const CreateAddressRequestSchema = buildAddressRequestSchema();

export type CreateAddressRequest = z.output<typeof CreateAddressRequestSchema>;

registry.registerPath({
  method: "post",
  path: "/accounts/me/addresses",
  tags: ["accounts"],
  summary: "Agrega una nueva dirección de envío guardada",
  request: {
    body: {
      content: { "application/json": { schema: AddressRequestBodySchema } },
    },
  },
  responses: {
    201: {
      description: "Dirección creada. La primera dirección activa de la cuenta queda como predeterminada automáticamente.",
      content: { "application/json": { schema: AddressResponseSchema } },
    },
    400: { description: "Datos inválidos (teléfono, código postal o país no soportado)." },
    401: { description: "No autenticado." },
  },
  security: [{ bearerAuth: [] }],
});
