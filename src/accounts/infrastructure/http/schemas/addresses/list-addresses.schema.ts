import { z } from "zod";
import { registry } from "../../../../../shared-kernel/infrastructure/swagger/registry";
import { AddressResponseSchema } from "./address-response.schema";

export const ListAddressesResponseSchema = z.array(AddressResponseSchema);

registry.registerPath({
  method: "get",
  path: "/accounts/me/addresses",
  tags: ["accounts"],
  summary: "Lista las direcciones de envío guardadas de la cuenta autenticada",
  responses: {
    200: {
      description: "Direcciones de la cuenta, incluidas las archivadas.",
      content: { "application/json": { schema: ListAddressesResponseSchema } },
    },
    401: { description: "No autenticado." },
  },
  security: [{ bearerAuth: [] }],
});
