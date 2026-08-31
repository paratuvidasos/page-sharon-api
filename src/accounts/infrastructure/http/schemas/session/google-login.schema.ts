import { z } from "zod";
import { registry } from "../../../../../shared-kernel/infrastructure/swagger/registry";
import { LoginResponseSchema } from "./login.schema";

export const GoogleLoginRequestSchema = z.object({
  sessionToken: z.string().min(1).openapi({
    description: "Session token entregado por Clerk en el frontend tras \"Continuar con Google\".",
  }),
  rememberMe: z.boolean().optional().default(false),
});

export type GoogleLoginRequest = z.infer<typeof GoogleLoginRequestSchema>;

registry.registerPath({
  method: "post",
  path: "/accounts/oauth/google",
  tags: ["accounts"],
  summary: "Inicia sesión (o crea la cuenta) a partir de un login con Google vía Clerk",
  request: {
    body: {
      content: { "application/json": { schema: GoogleLoginRequestSchema } },
    },
  },
  responses: {
    200: {
      description:
        "Login o registro por Google exitoso. Si el email ya existía con contraseña, la cuenta queda vinculada a la identidad de Google. El refresh token se entrega en una cookie httpOnly, no en el body.",
      content: { "application/json": { schema: LoginResponseSchema } },
    },
    401: { description: "El session token de Clerk no pudo verificarse." },
    403: { description: "La cuenta asociada a ese correo no está activa." },
  },
});
