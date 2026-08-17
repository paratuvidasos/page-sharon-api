import { z } from "zod";
import { normalizePhoneToE164, validatePhoneForCountry } from "../../validation/phone";
import { SUPPORTED_ADDRESS_COUNTRY_CODES, validatePostalCodeForCountry } from "../../validation/postal-code";

const AddressFieldsShape = {
  alias: z.string().min(1).max(50).openapi({ example: "Casa" }),
  recipientName: z.string().min(1).max(150).openapi({ example: "Sharon Gómez" }),
  phone: z.string().min(1).max(30).openapi({ example: "3001234567" }),
  countryCode: z
    .enum(SUPPORTED_ADDRESS_COUNTRY_CODES)
    .openapi({ example: "CO", description: "Código de país ISO 3166-1 alpha-2." }),
  stateProvince: z.string().min(1).max(100).openapi({ example: "Cundinamarca" }),
  city: z.string().min(1).max(100).openapi({ example: "Bogotá" }),
  postalCode: z.string().min(1).max(20).openapi({ example: "110111" }),
  line1: z.string().min(5).max(200).openapi({ example: "Calle 123 #45-67" }),
  line2: z.string().max(200).optional().openapi({ example: "Apto 501" }),
};

export function buildAddressRequestSchema() {
  return z
    .object(AddressFieldsShape)
    .superRefine((data, ctx) => {
      validatePhoneForCountry(ctx, data.phone, data.countryCode);
      validatePostalCodeForCountry(ctx, data.postalCode, data.countryCode);
    })
    .transform((data) => ({
      alias: data.alias,
      recipientName: data.recipientName,
      phone: normalizePhoneToE164(data.phone, data.countryCode),
      countryCode: data.countryCode,
      stateProvince: data.stateProvince,
      city: data.city,
      postalCode: data.postalCode,
      line1: data.line1,
      line2: data.line2 ?? null,
    }));
}

export const AddressRequestBodySchema = z.object(AddressFieldsShape);
