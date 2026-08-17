import { z } from "zod";
import { registry } from "../../../../shared-kernel/infrastructure/swagger/registry";
import { UserRole } from "../../../domain/enums/UserRole";

export const LoginRequestSchema = z.object({
  email: z.string().email().max(255).openapi({ example: "sharon@example.com" }),
  password: z.string().min(1).openapi({ example: "Sharon123" }),
  rememberMe: z.boolean().optional().default(false),
});

export type LoginRequest = z.infer<typeof LoginRequestSchema>;

export const LoginResponseSchema = z.object({
  accessToken: z.string(),
  expiresIn: z.number().openapi({ description: "Segundos de vigencia del access token." }),
  user: z.object({
    id: z.string().uuid(),
    email: z.string().email(),
    firstName: z.string(),
    lastName: z.string(),
    role: z.nativeEnum(UserRole),
  }),
});

registry.registerPath({
  method: "post",
  path: "/accounts/login",
  tags: ["accounts"],
  summary: "Inicia sesión con correo y contraseña",
  request: {
    body: {
      content: { "application/json": { schema: LoginRequestSchema } },
    },
  },
  responses: {
    200: {
      description:
        "Login exitoso. El refresh token se entrega en una cookie httpOnly, no en el body.",
      content: { "application/json": { schema: LoginResponseSchema } },
    },
    401: { description: "Correo o contraseña incorrectos." },
    403: { description: "La cuenta no está activa." },
    423: { description: "La cuenta está bloqueada temporalmente por intentos fallidos." },
  },
});
