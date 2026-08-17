import { z } from "zod";
import { registry } from "../../../../../shared-kernel/infrastructure/swagger/registry";

export const RequestPasswordResetRequestSchema = z.object({
  email: z.string().email().max(255).openapi({ example: "sharon@example.com" }),
});

export type RequestPasswordResetRequest = z.infer<typeof RequestPasswordResetRequestSchema>;

export const RequestPasswordResetResponseSchema = z.object({
  message: z.string().openapi({
    example: "Si el correo ingresado corresponde a una cuenta, te enviamos un enlace para recuperarla.",
  }),
});

registry.registerPath({
  method: "post",
  path: "/accounts/forgot-password",
  tags: ["accounts"],
  summary: "Solicita el enlace de recuperación de contraseña",
  request: {
    body: {
      content: { "application/json": { schema: RequestPasswordResetRequestSchema } },
    },
  },
  responses: {
    200: {
      description: "Misma respuesta exista o no la cuenta (por seguridad).",
      content: { "application/json": { schema: RequestPasswordResetResponseSchema } },
    },
    400: { description: "Datos de entrada inválidos." },
  },
});
