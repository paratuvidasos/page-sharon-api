import { z } from "zod";
import { registry } from "../../../../shared-kernel/infrastructure/swagger/registry";

const PASSWORD_PATTERN = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;

export const ResetPasswordRequestSchema = z
  .object({
    token: z.string().min(1).openapi({ example: "a1b2c3..." }),
    newPassword: z
      .string()
      .regex(PASSWORD_PATTERN, "La contraseña debe tener al menos 8 caracteres, con letras y números.")
      .openapi({ example: "Sharon123" }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Las contraseñas no coinciden.",
    path: ["confirmPassword"],
  });

export type ResetPasswordRequest = z.infer<typeof ResetPasswordRequestSchema>;

export const ResetPasswordResponseSchema = z.object({
  message: z.string().openapi({ example: "Tu contraseña se actualizó correctamente." }),
});

registry.registerPath({
  method: "post",
  path: "/accounts/reset-password",
  tags: ["accounts"],
  summary: "Define una nueva contraseña a partir del token de recuperación",
  request: {
    body: {
      content: { "application/json": { schema: ResetPasswordRequestSchema } },
    },
  },
  responses: {
    200: {
      description: "Contraseña actualizada. Se cerraron todas las sesiones activas previas.",
      content: { "application/json": { schema: ResetPasswordResponseSchema } },
    },
    400: { description: "Token inválido/expirado o datos de entrada inválidos." },
  },
});
