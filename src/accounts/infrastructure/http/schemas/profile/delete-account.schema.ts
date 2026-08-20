import { z } from "zod";
import { registry } from "../../../../../shared-kernel/infrastructure/swagger/registry";

export const DeleteAccountRequestSchema = z.object({
  password: z.string().min(1).openapi({
    example: "MiContraseñaActual123",
    description: "Contraseña actual, requerida para confirmar la eliminación.",
  }),
  reason: z.string().max(500).optional().openapi({
    example: "Ya no uso la plataforma.",
    description: "Motivo opcional de la eliminación de la cuenta.",
  }),
});

export type DeleteAccountRequest = z.infer<typeof DeleteAccountRequestSchema>;

export const DeleteAccountResponseSchema = z.object({
  message: z.string().openapi({
    example: "Tu cuenta y tus datos personales fueron eliminados correctamente.",
  }),
});

registry.registerPath({
  method: "delete",
  path: "/accounts/me",
  tags: ["accounts"],
  summary: "Elimina la cuenta autenticada y anonimiza sus datos personales",
  request: {
    body: {
      content: { "application/json": { schema: DeleteAccountRequestSchema } },
    },
  },
  responses: {
    200: {
      description: "Cuenta eliminada. Se cerraron todas las sesiones activas.",
      content: { "application/json": { schema: DeleteAccountResponseSchema } },
    },
    400: { description: "Datos inválidos." },
    401: { description: "No autenticado o contraseña incorrecta." },
  },
  security: [{ bearerAuth: [] }],
});
