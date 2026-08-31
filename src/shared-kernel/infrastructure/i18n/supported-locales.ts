import { DEFAULT_LOCALE, Locale } from "../../domain/enums/Locale";

/**
 * Idiomas que la tienda ofrece hoy. Se lee de `SUPPORTED_LOCALES` para poder
 * activar/desactivar un idioma sin tocar código, pero siempre incluye
 * `DEFAULT_LOCALE` — igual que `readSupportedCurrencies`, quedarse sin
 * ningún idioma válido dejaría el catálogo sin idioma de respaldo.
 */
export function readSupportedLocales(): Locale[] {
  const configured = (process.env.SUPPORTED_LOCALES ?? "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter((value): value is Locale => value in LOCALE_VALUES);

  return configured.includes(DEFAULT_LOCALE) ? configured : [DEFAULT_LOCALE, ...configured];
}

const LOCALE_VALUES: Record<string, true> = Object.fromEntries(
  Object.values(Locale).map((locale) => [locale, true as const]),
);
