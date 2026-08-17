import { z } from "zod";

export const AddressIdParamsSchema = z.object({
  addressId: z.string().uuid(),
});

export const AddressResponseSchema = z.object({
  id: z.string().uuid(),
  alias: z.string().openapi({ example: "Casa" }),
  recipientName: z.string().openapi({ example: "Sharon Gómez" }),
  phone: z.string().openapi({ example: "+573001234567" }),
  countryCode: z.string().openapi({ example: "CO" }),
  stateProvince: z.string().openapi({ example: "Cundinamarca" }),
  city: z.string().openapi({ example: "Bogotá" }),
  postalCode: z.string().openapi({ example: "110111" }),
  line1: z.string().openapi({ example: "Calle 123 #45-67" }),
  line2: z.string().nullable().openapi({ example: "Apto 501" }),
  isDefault: z.boolean(),
  archived: z.boolean(),
});
