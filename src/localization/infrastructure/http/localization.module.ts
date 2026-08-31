import { Router } from "express";
import { Currency } from "../../../shared-kernel/domain/enums/Currency";
import { Locale } from "../../../shared-kernel/domain/enums/Locale";
import { ExchangeRateProvider } from "../../../shared-kernel/domain/ports/ExchangeRateProvider";
import { GeoLocationProvider } from "../../../shared-kernel/domain/ports/GeoLocationProvider";
import { buildOptionalAuthenticate } from "../../../shared-kernel/infrastructure/http/optional-authenticate.middleware";
import { JwtTokenService } from "../../../shared-kernel/infrastructure/security/JwtTokenService";
import { ListSupportedCurrencies } from "../../application/use-cases/ListSupportedCurrencies";
import { ListSupportedLocales } from "../../application/use-cases/ListSupportedLocales";
import { SuggestPreferences } from "../../application/use-cases/SuggestPreferences";
import { UpdatePreferences } from "../../application/use-cases/UpdatePreferences";
import { GetUserLocalePreferencePort, UpdateUserLocalePreferencePort } from "../../application/ports/UserLocalePreferencePort";
import { LocalizationController } from "./localization.controller";
import { buildLocalizationRoutes } from "./localization.routes";

export interface LocalizationModule {
  router: Router;
}

export function buildLocalizationModule(
  supportedLocales: Locale[],
  supportedCurrencies: Currency[],
  exchangeRateProvider: ExchangeRateProvider,
  geoLocationProvider: GeoLocationProvider,
  getUserLocalePreference: GetUserLocalePreferencePort,
  updateUserLocalePreference: UpdateUserLocalePreferencePort,
): LocalizationModule {
  const listSupportedLocales = new ListSupportedLocales(supportedLocales);
  const listSupportedCurrencies = new ListSupportedCurrencies(supportedCurrencies, exchangeRateProvider);
  const suggestPreferences = new SuggestPreferences(geoLocationProvider, getUserLocalePreference);
  const updatePreferences = new UpdatePreferences(updateUserLocalePreference);

  const controller = new LocalizationController(
    listSupportedLocales,
    listSupportedCurrencies,
    suggestPreferences,
    updatePreferences,
    supportedLocales,
    supportedCurrencies,
  );

  const tokenService = new JwtTokenService(requireJwtSecret());
  const optionalAuthenticate = buildOptionalAuthenticate(tokenService);

  return { router: buildLocalizationRoutes(controller, optionalAuthenticate) };
}

function requireJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("Falta JWT_SECRET en el entorno.");
  }
  return secret;
}
