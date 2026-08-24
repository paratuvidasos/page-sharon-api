import { z } from "zod";
import { registry } from "../../../../../shared-kernel/infrastructure/swagger/registry";
import { normalizePhoneToE164, validatePhoneForCountry } from "../../validation/phone";

export const UpdateProfileRequestSchema = z
  .object({
    firstName: z.string().min(1).max(100).openapi({ example: "Sharon" }),
    lastName: z.string().min(1).max(100).openapi({ example: "Gómez" }),
    phone: z.string().min(1).max(30).openapi({ example: "3001234567" }),
    phoneCountryCode: z
      .string()
      .length(2)
      .toUpperCase()
      .openapi({ example: "CO", description: "Código de país ISO 3166-1 alpha-2." }),
  })
  .superRefine((data, ctx) => {
    validatePhoneForCountry(ctx, data.phone, data.phoneCountryCode);
  })
  .transform((data) => ({
    firstName: data.firstName,
    lastName: data.lastName,
    phone: normalizePhoneToE164(data.phone, data.phoneCountryCode),
  }));

export type UpdateProfileRequest = z.output<typeof UpdateProfileRequestSchema>;

export const UpdateProfileResponseSchema = z.object({
  id: z.string().uuid(),
  firstName: z.string(),
  lastName: z.string(),
  phone: z.string().nullable(),
  avatarUrl: z.string().nullable(),
});

registry.registerPath({
  method: "patch",
  path: "/accounts/me",
  tags: ["accounts"],
  summary: "Actualiza nombre, teléfono y foto de perfil de la cuenta autenticada",
  request: {
    body: {
      content: {
        "multipart/form-data": {
          schema: z.object({
            firstName: z.string(),
            lastName: z.string(),
            phone: z.string(),
            phoneCountryCode: z.string(),
            avatar: z
              .string()
              .optional()
              .openapi({ format: "binary", description: "Opcional. JPG, PNG o WEBP." }),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: "Perfil actualizado.",
      content: { "application/json": { schema: UpdateProfileResponseSchema } },
    },
    400: { description: "Datos inválidos (teléfono, país o archivo de foto)." },
    401: { description: "No autenticado." },
  },
  security: [{ bearerAuth: [] }],
});
