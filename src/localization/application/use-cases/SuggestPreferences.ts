import { BASE_CURRENCY, Currency } from "../../../shared-kernel/domain/enums/Currency";
import { DEFAULT_LOCALE, Locale } from "../../../shared-kernel/domain/enums/Locale";
import { GeoLocationProvider } from "../../../shared-kernel/domain/ports/GeoLocationProvider";
import { suggestFor } from "../../domain/locale-suggestion";
import { GetUserLocalePreferencePort } from "../ports/UserLocalePreferencePort";

export type PreferenceSource = "ACCOUNT" | "COOKIE" | "GEOIP" | "HEADER" | "DEFAULT";

export interface SuggestPreferencesInput {
  userId: string | null;
  cookieLocale: Locale | null;
  cookieCurrency: Currency | null;
  ip: string;
  acceptLanguage: string | undefined;
  supportedLocales: Locale[];
  supportedCurrencies: Currency[];
}

export interface SuggestPreferencesResult {
  locale: Locale;
  currency: Currency;
  source: PreferenceSource;
  detectedCountry: string | null;
}

/**
 * [0070]: resuelve el idioma/moneda a mostrar, sin pisar nunca una
 * preferencia ya guardada — ni la de la cuenta ni la de la cookie de
 * invitado. Solo cuando ninguna de las dos existe se consulta geo-IP; ese
 * corto-circuito es el CA 3 de la US, no una optimización: llamar al
 * proveedor externo para un visitante que ya eligió sería tirar la plata (y
 * el tiempo de respuesta) sin ningún efecto en el resultado.
 */
export class SuggestPreferences {
  constructor(
    private readonly geoLocationProvider: GeoLocationProvider,
    private readonly getUserLocalePreference: GetUserLocalePreferencePort,
  ) {}

  async execute(input: SuggestPreferencesInput): Promise<SuggestPreferencesResult> {
    if (input.userId) {
      const preference = await this.getUserLocalePreference.execute({ userId: input.userId });
      if (preference && (preference.locale !== null || preference.currency !== null)) {
        return {
          locale: preference.locale ?? this.fallbackLocale(input),
          currency: preference.currency ?? this.fallbackCurrency(input),
          source: "ACCOUNT",
          detectedCountry: null,
        };
      }
    }

    if (input.cookieLocale !== null || input.cookieCurrency !== null) {
      return {
        locale: input.cookieLocale ?? this.fallbackLocale(input),
        currency: input.cookieCurrency ?? this.fallbackCurrency(input),
        source: "COOKIE",
        detectedCountry: null,
      };
    }

    const country = await this.resolveCountry(input.ip);
    const suggestion = suggestFor({
      country,
      acceptLanguage: input.acceptLanguage,
      supportedLocales: input.supportedLocales,
      supportedCurrencies: input.supportedCurrencies,
    });

    return {
      ...suggestion,
      source: this.sourceFor(country, input),
      detectedCountry: country,
    };
  }

  private async resolveCountry(ip: string): Promise<string | null> {
    try {
      return await this.geoLocationProvider.resolveCountry(ip);
    } catch (error) {
      console.error(
        "[localization] geo-IP no pudo resolver el país; se degrada a Accept-Language:",
        error,
      );
      return null;
    }
  }

  private sourceFor(country: string | null, input: SuggestPreferencesInput): PreferenceSource {
    if (country) return "GEOIP";

    const primary = input.acceptLanguage?.split(",")[0]?.split(";")[0]?.split("-")[0]?.trim().toLowerCase();
    return primary && input.supportedLocales.includes(primary as Locale) ? "HEADER" : "DEFAULT";
  }

  private fallbackLocale(input: SuggestPreferencesInput): Locale {
    return input.supportedLocales.includes(DEFAULT_LOCALE) ? DEFAULT_LOCALE : input.supportedLocales[0];
  }

  private fallbackCurrency(input: SuggestPreferencesInput): Currency {
    return input.supportedCurrencies.includes(BASE_CURRENCY) ? BASE_CURRENCY : input.supportedCurrencies[0];
  }
}
