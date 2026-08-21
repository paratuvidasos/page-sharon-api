import { z } from "zod";
import { registry } from "../../../../shared-kernel/infrastructure/swagger/registry";

export const ResendVerificationEmailRequestSchema = z.object({
  email: z.string().email().max(255).openapi({ example: "sharon@example.com" }),
});

export type ResendVerificationEmailRequest = z.infer<typeof ResendVerificationEmailRequestSchema>;

export const ResendVerificationEmailResponseSchema = z.object({
  message: z.string().openapi({
    example: "Si el correo ingresado corresponde a una cuenta sin verificar, te reenviamos el enlace.",
  }),
});

registry.registerPath({
  method: "post",
  path: "/accounts/resend-verification-email",
  tags: ["accounts"],
  summary: "Reenvía el correo de verificación de cuenta",
  request: {
    body: {
      content: { "application/json": { schema: ResendVerificationEmailRequestSchema } },
    },
  },
  responses: {
    200: {
      description:
        "Misma respuesta exista o no la cuenta, y esté o no ya verificada (por seguridad).",
      content: { "application/json": { schema: ResendVerificationEmailResponseSchema } },
    },
    400: { description: "Datos de entrada inválidos." },
  },
});
