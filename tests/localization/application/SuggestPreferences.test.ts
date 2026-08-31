import { describe, expect, it, vi } from "vitest";
import { Currency } from "../../../src/shared-kernel/domain/enums/Currency";
import { Locale } from "../../../src/shared-kernel/domain/enums/Locale";
import { GeoLocationProvider } from "../../../src/shared-kernel/domain/ports/GeoLocationProvider";
import { GetUserLocalePreferencePort } from "../../../src/localization/application/ports/UserLocalePreferencePort";
import { SuggestPreferences } from "../../../src/localization/application/use-cases/SuggestPreferences";

const supportedLocales = [Locale.ES, Locale.EN];
const supportedCurrencies = [Currency.COP, Currency.USD];

function buildBaseInput() {
  return {
    userId: null as string | null,
    cookieLocale: null as Locale | null,
    cookieCurrency: null as Currency | null,
    ip: "203.0.113.1",
    acceptLanguage: undefined as string | undefined,
    supportedLocales,
    supportedCurrencies,
  };
}

function buildGeoLocationProvider(country: string | null): GeoLocationProvider {
  return { resolveCountry: vi.fn(async () => country) };
}

function buildGetUserLocalePreference(
  result: { locale: Locale | null; currency: Currency | null } | null,
): GetUserLocalePreferencePort {
  return { execute: vi.fn(async () => result) };
}

describe("SuggestPreferences", () => {
  it("usa la preferencia de la cuenta y NO llama al geo-IP cuando ya existe", async () => {
    const geoLocationProvider = buildGeoLocationProvider("US");
    const getUserLocalePreference = buildGetUserLocalePreference({ locale: Locale.EN, currency: Currency.USD });
    const useCase = new SuggestPreferences(geoLocationProvider, getUserLocalePreference);

    const result = await useCase.execute({ ...buildBaseInput(), userId: "user-1" });

    expect(result).toEqual({ locale: Locale.EN, currency: Currency.USD, source: "ACCOUNT", detectedCountry: null });
    expect(geoLocationProvider.resolveCountry).not.toHaveBeenCalled();
  });

  it("usa la cookie y NO llama al geo-IP cuando ya existe, sin cuenta", async () => {
    const geoLocationProvider = buildGeoLocationProvider("US");
    const getUserLocalePreference = buildGetUserLocalePreference(null);
    const useCase = new SuggestPreferences(geoLocationProvider, getUserLocalePreference);

    const result = await useCase.execute({
      ...buildBaseInput(),
      cookieLocale: Locale.EN,
      cookieCurrency: Currency.USD,
    });

    expect(result).toEqual({ locale: Locale.EN, currency: Currency.USD, source: "COOKIE", detectedCountry: null });
    expect(geoLocationProvider.resolveCountry).not.toHaveBeenCalled();
  });

  it("sin cuenta ni cookie, consulta geo-IP y sugiere según el país", async () => {
    const geoLocationProvider = buildGeoLocationProvider("US");
    const getUserLocalePreference = buildGetUserLocalePreference(null);
    const useCase = new SuggestPreferences(geoLocationProvider, getUserLocalePreference);

    const result = await useCase.execute(buildBaseInput());

    expect(result).toEqual({ locale: Locale.EN, currency: Currency.USD, source: "GEOIP", detectedCountry: "US" });
    expect(geoLocationProvider.resolveCountry).toHaveBeenCalledWith("203.0.113.1");
  });

  it("si el geo-IP falla, degrada a Accept-Language sin lanzar", async () => {
    const geoLocationProvider: GeoLocationProvider = {
      resolveCountry: vi.fn(async () => {
        throw new Error("timeout");
      }),
    };
    const getUserLocalePreference = buildGetUserLocalePreference(null);
    const useCase = new SuggestPreferences(geoLocationProvider, getUserLocalePreference);

    const result = await useCase.execute({ ...buildBaseInput(), acceptLanguage: "en-US,en;q=0.9" });

    expect(result.locale).toBe(Locale.EN);
    expect(result.source).toBe("HEADER");
    expect(result.detectedCountry).toBeNull();
  });

  it("sin nada resuelto, cae a los valores por defecto", async () => {
    const geoLocationProvider = buildGeoLocationProvider(null);
    const getUserLocalePreference = buildGetUserLocalePreference(null);
    const useCase = new SuggestPreferences(geoLocationProvider, getUserLocalePreference);

    const result = await useCase.execute(buildBaseInput());

    expect(result).toEqual({ locale: Locale.ES, currency: Currency.COP, source: "DEFAULT", detectedCountry: null });
  });
});
