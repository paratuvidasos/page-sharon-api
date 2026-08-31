import { z } from "zod";
import { registry } from "../../../../../shared-kernel/infrastructure/swagger/registry";

const PASSWORD_PATTERN = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;

export const SetPasswordRequestSchema = z.object({
  newPassword: z
    .string()
    .regex(PASSWORD_PATTERN, "La contraseña debe tener al menos 8 caracteres, con letras y números.")
    .openapi({ example: "Sharon123" }),
});

export type SetPasswordRequest = z.infer<typeof SetPasswordRequestSchema>;

export const SetPasswordResponseSchema = z.object({
  message: z.string().openapi({ example: "Tu contraseña se creó correctamente." }),
});

registry.registerPath({
  method: "post",
  path: "/accounts/set-password",
  tags: ["accounts"],
  summary: "Define la primera contraseña de una cuenta que hasta ahora solo tenía login con Google",
  request: {
    body: {
      content: { "application/json": { schema: SetPasswordRequestSchema } },
    },
  },
  responses: {
    200: {
      description: "Contraseña creada correctamente.",
      content: { "application/json": { schema: SetPasswordResponseSchema } },
    },
    400: { description: "Datos inválidos." },
    401: { description: "No autenticado." },
    409: { description: "La cuenta ya tiene una contraseña; usa el flujo de cambio de contraseña." },
  },
  security: [{ bearerAuth: [] }],
});
