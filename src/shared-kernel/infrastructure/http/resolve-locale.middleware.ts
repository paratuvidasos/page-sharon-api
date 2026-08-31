import { NextFunction, Request, Response } from "express";
import { BASE_CURRENCY, Currency } from "../../domain/enums/Currency";
import { DEFAULT_LOCALE, Locale } from "../../domain/enums/Locale";

declare global {
  namespace Express {
    interface Request {
      locale: Locale;
      currency: Currency;
    }
  }
}

export const LOCALE_COOKIE_NAME = "locale";
export const CURRENCY_COOKIE_NAME = "currency";
export const PREFERENCE_COOKIE_TTL_MS = 365 * 24 * 60 * 60 * 1000;

/**
 * [0067]/[0068]/[0070]: resuelve `req.locale`/`req.currency` para toda la
 * app, con esta precedencia (de mayor a menor):
 *
 * 1. query `?lang=`/`?currency=` — override explícito, útil para links
 *    compartidos y SSR.
 * 2. cookie `locale`/`currency` — lo que el visitante ya eligió o lo que
 *    `PUT /localization/preferences` guardó.
 * 3. `Accept-Language`.
 * 4. `DEFAULT_LOCALE`/`BASE_CURRENCY`.
 *
 * Un valor no soportado se ignora y se cae al siguiente nivel — nunca 400:
 * esto corre en cada request, no tiene sentido tumbar la página por un
 * parámetro mal escrito.
 */
export function buildResolveLocale(supportedLocales: Locale[], supportedCurrencies: Currency[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    req.locale = resolveLocale(req, supportedLocales);
    req.currency = resolveCurrency(req, supportedCurrencies);
    next();
  };
}

function resolveLocale(req: Request, supported: Locale[]): Locale {
  const fromQuery = asLocale(req.query.lang, supported);
  if (fromQuery) return fromQuery;

  const fromCookie = asLocale(req.cookies?.[LOCALE_COOKIE_NAME], supported);
  if (fromCookie) return fromCookie;

  const fromHeader = localeFromAcceptLanguage(req.headers["accept-language"], supported);
  if (fromHeader) return fromHeader;

  return supported.includes(DEFAULT_LOCALE) ? DEFAULT_LOCALE : supported[0];
}

function resolveCurrency(req: Request, supported: Currency[]): Currency {
  const fromQuery = asCurrency(req.query.currency, supported);
  if (fromQuery) return fromQuery;

  const fromCookie = asCurrency(req.cookies?.[CURRENCY_COOKIE_NAME], supported);
  if (fromCookie) return fromCookie;

  return supported.includes(BASE_CURRENCY) ? BASE_CURRENCY : supported[0];
}

function asLocale(value: unknown, supported: Locale[]): Locale | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toLowerCase();
  return supported.find((locale) => locale === normalized) ?? null;
}

function asCurrency(value: unknown, supported: Currency[]): Currency | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toUpperCase();
  return supported.find((currency) => currency === normalized) ?? null;
}

function localeFromAcceptLanguage(header: string | undefined, supported: Locale[]): Locale | null {
  if (!header) return null;

  const tags = header
    .split(",")
    .map((tag) => tag.split(";")[0]?.trim().toLowerCase())
    .filter((tag): tag is string => !!tag);

  for (const tag of tags) {
    const primary = tag.split("-")[0];
    const match = supported.find((locale) => locale === primary);
    if (match) return match;
  }

  return null;
}
