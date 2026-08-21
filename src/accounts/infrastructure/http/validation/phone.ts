import { CountryCode, isValidPhoneNumber, parsePhoneNumber } from "libphonenumber-js";
import { z } from "zod";

export function validatePhoneForCountry(
  ctx: z.RefinementCtx,
  phone: string,
  countryCode: string,
  path: (string | number)[] = ["phone"],
): void {
  if (!isValidPhoneNumber(phone, countryCode as CountryCode)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "El teléfono no es válido para el país seleccionado.",
      path,
    });
  }
}

export function normalizePhoneToE164(phone: string, countryCode: string): string {
  return parsePhoneNumber(phone, countryCode as CountryCode).number as string;
}
