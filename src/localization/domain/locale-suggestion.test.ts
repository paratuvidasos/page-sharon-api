import { describe, expect, it } from "vitest";
import { Currency } from "../../shared-kernel/domain/enums/Currency";
import { Locale } from "../../shared-kernel/domain/enums/Locale";
import { suggestFor } from "./locale-suggestion";

const supportedLocales = [Locale.ES, Locale.EN];
const supportedCurrencies = [Currency.COP, Currency.USD];

describe("suggestFor", () => {
  it("sugiere es/COP para Colombia", () => {
    const result = suggestFor({
      country: "CO",
      acceptLanguage: undefined,
      supportedLocales,
      supportedCurrencies,
    });

    expect(result).toEqual({ locale: Locale.ES, currency: Currency.COP });
  });

  it("sugiere en/USD para Estados Unidos", () => {
    const result = suggestFor({
      country: "US",
      acceptLanguage: undefined,
      supportedLocales,
      supportedCurrencies,
    });

    expect(result).toEqual({ locale: Locale.EN, currency: Currency.USD });
  });

  it("un país desconocido cae al Accept-Language si coincide con un idioma soportado", () => {
    const result = suggestFor({
      country: "DE",
      acceptLanguage: "en-US,en;q=0.9",
      supportedLocales,
      supportedCurrencies,
    });

    expect(result.locale).toBe(Locale.EN);
  });

  it("sin país ni Accept-Language útiles, cae al idioma/moneda base", () => {
    const result = suggestFor({
      country: null,
      acceptLanguage: undefined,
      supportedLocales,
      supportedCurrencies,
    });

    expect(result).toEqual({ locale: Locale.ES, currency: Currency.COP });
  });

  it("un locale no soportado se ignora aunque el país lo sugiera", () => {
    const result = suggestFor({
      country: "US",
      acceptLanguage: undefined,
      supportedLocales: [Locale.ES],
      supportedCurrencies,
    });

    expect(result.locale).toBe(Locale.ES);
  });
});
