import { z } from "zod";
import { registry } from "../../../../shared-kernel/infrastructure/swagger/registry";

export const VerifyEmailQuerySchema = z.object({
  token: z.string().min(1).openapi({ example: "a1b2c3..." }),
});

export type VerifyEmailQuery = z.infer<typeof VerifyEmailQuerySchema>;

export const VerifyEmailResponseSchema = z.object({
  message: z.string().openapi({ example: "Correo verificado correctamente." }),
});

registry.registerPath({
  method: "get",
  path: "/accounts/verify-email",
  tags: ["accounts"],
  summary: "Verifica el correo de una cuenta a partir del token enviado por email",
  request: {
    query: VerifyEmailQuerySchema,
  },
  responses: {
    200: {
      description: "Correo verificado.",
      content: { "application/json": { schema: VerifyEmailResponseSchema } },
    },
    400: { description: "Token inválido o expirado." },
  },
});
