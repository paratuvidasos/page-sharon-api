import { registry } from "../../../../shared-kernel/infrastructure/swagger/registry";
import { LoginResponseSchema } from "./login.schema";

registry.registerPath({
  method: "post",
  path: "/accounts/refresh-token",
  tags: ["accounts"],
  summary: "Emite un access token nuevo a partir de la cookie httpOnly de refresh token",
  description:
    "No recibe body: el refresh token se lee de la cookie httpOnly 'refresh_token' enviada por el navegador. Rota el refresh token en cada uso.",
  responses: {
    200: {
      description: "Access token renovado.",
      content: { "application/json": { schema: LoginResponseSchema } },
    },
    401: { description: "El refresh token no existe, expiró, fue revocado o no vino en la request." },
    403: { description: "La cuenta no está activa." },
  },
});
