import { Request, Response } from "express";
import {
  CURRENCY_COOKIE_NAME,
  LOCALE_COOKIE_NAME,
  PREFERENCE_COOKIE_TTL_MS,
} from "../../../shared-kernel/infrastructure/http/resolve-locale.middleware";
import { Currency } from "../../../shared-kernel/domain/enums/Currency";
import { Locale } from "../../../shared-kernel/domain/enums/Locale";
import { ListSupportedCurrencies } from "../../application/use-cases/ListSupportedCurrencies";
import { ListSupportedLocales } from "../../application/use-cases/ListSupportedLocales";
import { SuggestPreferences } from "../../application/use-cases/SuggestPreferences";
import { UpdatePreferences } from "../../application/use-cases/UpdatePreferences";
import { UpdatePreferencesRequestSchema } from "./schemas/preferences.schema";

export class LocalizationController {
  constructor(
    private readonly listSupportedLocales: ListSupportedLocales,
    private readonly listSupportedCurrencies: ListSupportedCurrencies,
    private readonly suggestPreferences: SuggestPreferences,
    private readonly updatePreferences: UpdatePreferences,
    private readonly supportedLocales: Locale[],
    private readonly supportedCurrencies: Currency[],
  ) {}

  listLocales = async (_req: Request, res: Response): Promise<void> => {
    res.status(200).json(this.listSupportedLocales.execute());
  };

  listCurrencies = async (_req: Request, res: Response): Promise<void> => {
    const result = await this.listSupportedCurrencies.execute();
    res.status(200).json(result);
  };

  getPreferences = async (req: Request, res: Response): Promise<void> => {
    const result = await this.suggestPreferences.execute({
      userId: req.authUser?.sub ?? null,
      cookieLocale: cookieLocale(req, this.supportedLocales),
      cookieCurrency: cookieCurrency(req, this.supportedCurrencies),
      ip: clientIp(req),
      acceptLanguage: req.headers["accept-language"],
      supportedLocales: this.supportedLocales,
      supportedCurrencies: this.supportedCurrencies,
    });
    res.status(200).json(result);
  };

  putPreferences = async (req: Request, res: Response): Promise<void> => {
    const body = UpdatePreferencesRequestSchema.parse(req.body);

    await this.updatePreferences.execute({
      userId: req.authUser?.sub ?? null,
      locale: body.locale,
      currency: body.currency,
    });

    if (body.locale) {
      res.cookie(LOCALE_COOKIE_NAME, body.locale, cookieOptions());
    }
    if (body.currency) {
      res.cookie(CURRENCY_COOKIE_NAME, body.currency, cookieOptions());
    }

    res.status(204).send();
  };
}

function cookieOptions() {
  return {
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    expires: new Date(Date.now() + PREFERENCE_COOKIE_TTL_MS),
  };
}

function cookieLocale(req: Request, supported: Locale[]): Locale | null {
  const raw = req.cookies?.[LOCALE_COOKIE_NAME];
  return typeof raw === "string" ? supported.find((locale) => locale === raw) ?? null : null;
}

function cookieCurrency(req: Request, supported: Currency[]): Currency | null {
  const raw = req.cookies?.[CURRENCY_COOKIE_NAME];
  return typeof raw === "string" ? supported.find((currency) => currency === raw) ?? null : null;
}

function clientIp(req: Request): string {
  const forwardedFor = req.headers["x-forwarded-for"];
  const first = Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor?.split(",")[0];
  return first?.trim() || req.socket.remoteAddress || "";
}
