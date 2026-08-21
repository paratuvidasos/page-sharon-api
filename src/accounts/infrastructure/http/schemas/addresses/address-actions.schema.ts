import { registry } from "../../../../../shared-kernel/infrastructure/swagger/registry";
import { AddressIdParamsSchema, AddressResponseSchema } from "./address-response.schema";

registry.registerPath({
  method: "delete",
  path: "/accounts/me/addresses/{addressId}",
  tags: ["accounts"],
  summary: "Elimina una dirección de envío guardada",
  request: { params: AddressIdParamsSchema },
  responses: {
    204: { description: "Dirección eliminada." },
    401: { description: "No autenticado." },
    404: { description: "La dirección no existe o no pertenece a la cuenta." },
  },
  security: [{ bearerAuth: [] }],
});

registry.registerPath({
  method: "patch",
  path: "/accounts/me/addresses/{addressId}/default",
  tags: ["accounts"],
  summary: "Marca una dirección como predeterminada para envíos",
  request: { params: AddressIdParamsSchema },
  responses: {
    200: {
      description: "Dirección marcada como predeterminada.",
      content: { "application/json": { schema: AddressResponseSchema } },
    },
    400: { description: "No se puede marcar como predeterminada una dirección archivada." },
    401: { description: "No autenticado." },
    404: { description: "La dirección no existe o no pertenece a la cuenta." },
  },
  security: [{ bearerAuth: [] }],
});

registry.registerPath({
  method: "patch",
  path: "/accounts/me/addresses/{addressId}/archive",
  tags: ["accounts"],
  summary: "Archiva una dirección de envío (alternativa a eliminarla)",
  request: { params: AddressIdParamsSchema },
  responses: {
    200: {
      description: "Dirección archivada. Deja de ser la predeterminada si lo era.",
      content: { "application/json": { schema: AddressResponseSchema } },
    },
    401: { description: "No autenticado." },
    404: { description: "La dirección no existe o no pertenece a la cuenta." },
  },
  security: [{ bearerAuth: [] }],
});

registry.registerPath({
  method: "patch",
  path: "/accounts/me/addresses/{addressId}/restore",
  tags: ["accounts"],
  summary: "Restaura una dirección de envío previamente archivada",
  request: { params: AddressIdParamsSchema },
  responses: {
    200: {
      description: "Dirección restaurada.",
      content: { "application/json": { schema: AddressResponseSchema } },
    },
    401: { description: "No autenticado." },
    404: { description: "La dirección no existe o no pertenece a la cuenta." },
  },
  security: [{ bearerAuth: [] }],
});
