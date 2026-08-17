import { z } from "zod";
import { registry } from "../../../../shared-kernel/infrastructure/swagger/registry";

const PASSWORD_PATTERN = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;

export const RegisterRequestSchema = z
  .object({
    firstName: z.string().min(1).max(100).openapi({ example: "Sharon" }),
    lastName: z.string().min(1).max(100).openapi({ example: "Gómez" }),
    email: z.string().email().max(255).openapi({ example: "sharon@example.com" }),
    password: z
      .string()
      .regex(PASSWORD_PATTERN, "La contraseña debe tener al menos 8 caracteres, con letras y números.")
      .openapi({ example: "Sharon123" }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden.",
    path: ["confirmPassword"],
  });

export type RegisterRequest = z.infer<typeof RegisterRequestSchema>;

export const RegisterResponseSchema = z.object({
  message: z.string().openapi({
    example: "Si el correo ingresado es válido, revisa tu bandeja de entrada para continuar.",
  }),
});

registry.registerPath({
  method: "post",
  path: "/accounts/register",
  tags: ["accounts"],
  summary: "Registro de cuenta con correo y contraseña",
  request: {
    body: {
      content: { "application/json": { schema: RegisterRequestSchema } },
    },
  },
  responses: {
    201: {
      description: "Registro recibido (misma respuesta si el correo ya existía, por seguridad).",
      content: { "application/json": { schema: RegisterResponseSchema } },
    },
    400: { description: "Datos de entrada inválidos." },
  },
});
