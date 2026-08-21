import { z } from "zod";
import { registry } from "../../../../../shared-kernel/infrastructure/swagger/registry";

export const LogoutAllResponseSchema = z.object({
  message: z.string().openapi({
    example: "Se cerraron todas las sesiones activas. Debes iniciar sesión nuevamente en cada dispositivo.",
  }),
});

registry.registerPath({
  method: "post",
  path: "/accounts/logout-all",
  tags: ["accounts"],
  summary: "Cierra todas las sesiones activas del usuario en todos los dispositivos",
  responses: {
    200: {
      description: "Todas las sesiones fueron invalidadas; cada dispositivo deberá iniciar sesión de nuevo.",
      content: { "application/json": { schema: LogoutAllResponseSchema } },
    },
    401: { description: "No autenticado." },
  },
  security: [{ bearerAuth: [] }],
});
