import { z } from "zod";
import { registry } from "../../../../../shared-kernel/infrastructure/swagger/registry";
import { UserRole } from "../../../../domain/enums/UserRole";

export const GetProfileResponseSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email().openapi({ example: "sharon@example.com" }),
  firstName: z.string().openapi({ example: "Sharon" }),
  lastName: z.string().openapi({ example: "Gómez" }),
  phone: z.string().nullable().openapi({ example: "+573001234567" }),
  avatarUrl: z.string().nullable(),
  role: z.nativeEnum(UserRole),
});

registry.registerPath({
  method: "get",
  path: "/accounts/me",
  tags: ["accounts"],
  summary: "Obtiene el perfil de la cuenta autenticada",
  responses: {
    200: {
      description: "Perfil de la cuenta.",
      content: { "application/json": { schema: GetProfileResponseSchema } },
    },
    401: { description: "No autenticado." },
  },
  security: [{ bearerAuth: [] }],
});
