import { z } from "zod";
import { registry } from "../../../../../shared-kernel/infrastructure/swagger/registry";

export const LogoutResponseSchema = z.object({
  message: z.string().openapi({ example: "Sesión cerrada correctamente." }),
});

registry.registerPath({
  method: "post",
  path: "/accounts/logout",
  tags: ["accounts"],
  summary: "Cierra la sesión del dispositivo actual",
  description:
    "No recibe body: el refresh token se lee de la cookie httpOnly 'refresh_token'. Idempotente: si la cookie no viene o el token ya es inválido/expirado, igual responde 200 y limpia la cookie.",
  responses: {
    200: {
      description: "Sesión cerrada (o ya lo estaba).",
      content: { "application/json": { schema: LogoutResponseSchema } },
    },
  },
});
