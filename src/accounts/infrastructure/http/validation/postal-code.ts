import { z } from "zod";

interface CountryPostalRule {
  name: string;
  regex: RegExp;
  example: string;
}

// Mismos 8 países soportados hoy en el selector del frontend
// (shared/data/countries.js en page-sharon-ecommerce) — mantener ambas listas
// sincronizadas si se agrega un país nuevo.
const POSTAL_CODE_RULES: Record<string, CountryPostalRule> = {
  CO: { name: "Colombia", regex: /^\d{6}$/, example: "110111" },
  MX: { name: "México", regex: /^\d{5}$/, example: "01000" },
  AR: { name: "Argentina", regex: /^\d{4}$/, example: "1000" },
  CL: { name: "Chile", regex: /^\d{7}$/, example: "8320000" },
  PE: { name: "Perú", regex: /^\d{5}$/, example: "15001" },
  EC: { name: "Ecuador", regex: /^\d{6}$/, example: "170150" },
  ES: { name: "España", regex: /^\d{5}$/, example: "28001" },
  US: { name: "Estados Unidos", regex: /^\d{5}(-\d{4})?$/, example: "10001" },
};

export const SUPPORTED_ADDRESS_COUNTRY_CODES = Object.keys(POSTAL_CODE_RULES) as [string, ...string[]];

export function validatePostalCodeForCountry(
  ctx: z.RefinementCtx,
  postalCode: string,
  countryCode: string,
  path: (string | number)[] = ["postalCode"],
): void {
  const rule = POSTAL_CODE_RULES[countryCode];
  if (!rule) return;

  if (!rule.regex.test(postalCode)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `Formato de código postal inválido para ${rule.name} (ej. ${rule.example}).`,
      path,
    });
  }
}
