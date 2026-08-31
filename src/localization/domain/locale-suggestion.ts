import { BASE_CURRENCY, Currency } from "../../shared-kernel/domain/enums/Currency";
import { DEFAULT_LOCALE, Locale } from "../../shared-kernel/domain/enums/Locale";

export interface LocaleSuggestionInput {
  /** Código ISO 3166-1 alpha-2, o `null` si no se pudo resolver por geo-IP. */
  country: string | null;
  acceptLanguage: string | undefined;
  supportedLocales: Locale[];
  supportedCurrencies: Currency[];
}

export interface LocaleSuggestion {
  locale: Locale;
  currency: Currency;
}

/**
 * [0070]: mapa mínimo país → (idioma, moneda) por defecto. Punto único a
 * extender cuando se sumen países objetivo — hoy solo Colombia (mercado
 * local) tiene una entrada propia; el resto cae al inglés/USD si están
 * soportados.
 */
const COUNTRY_DEFAULTS: Record<string, LocaleSuggestion> = {
  CO: { locale: Locale.ES, currency: Currency.COP },
  US: { locale: Locale.EN, currency: Currency.USD },
};

/**
 * Sugiere idioma/moneda a partir del país detectado, degradando a
 * `Accept-Language` y recortando siempre a lo que la tienda soporta hoy.
 */
export function suggestFor(input: LocaleSuggestionInput): LocaleSuggestion {
  const byCountry = input.country ? COUNTRY_DEFAULTS[input.country] : undefined;

  const locale = pickSupported(
    [byCountry?.locale, localeFromAcceptLanguage(input.acceptLanguage)],
    input.supportedLocales,
    DEFAULT_LOCALE,
  );
  const currency = pickSupported([byCountry?.currency], input.supportedCurrencies, BASE_CURRENCY);

  return { locale, currency };
}

function pickSupported<T extends string>(candidates: (T | undefined)[], supported: T[], fallback: T): T {
  for (const candidate of candidates) {
    if (candidate && supported.includes(candidate)) {
      return candidate;
    }
  }
  return supported.includes(fallback) ? fallback : supported[0];
}

function localeFromAcceptLanguage(header: string | undefined): Locale | undefined {
  if (!header) return undefined;
  const primary = header.split(",")[0]?.split(";")[0]?.split("-")[0]?.trim().toLowerCase();
  return Object.values(Locale).find((locale) => locale === primary);
}
