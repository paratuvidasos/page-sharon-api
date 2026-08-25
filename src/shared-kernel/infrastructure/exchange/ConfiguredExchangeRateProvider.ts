import { BASE_CURRENCY, Currency } from "../../domain/enums/Currency";
import { ExchangeRateProvider } from "../../domain/ports/ExchangeRateProvider";

const DEFAULT_USD_TO_COP = 4100;

/**
 * Implementación de arranque de `ExchangeRateProvider`: una tasa fija leída
 * de `EXCHANGE_RATE_USD_COP`. No consulta ningún servicio externo.
 *
 * Es deliberadamente simple: el alcance de internacionalización sigue "a
 * futuro" en el backlog ([0041]), así que integrar un proveedor de tasas de
 * verdad todavía no está definido. Lo que sí queda listo es que la tasa se
 * resuelva por un puerto y se congele en la orden, para que ese cambio sea
 * reemplazar esta clase y nada más.
 */
export class ConfiguredExchangeRateProvider implements ExchangeRateProvider {
  constructor(private readonly usdToCop: number = readUsdToCopRate()) {}

  async getRate(from: Currency, to: Currency): Promise<number> {
    if (from === to) {
      return 1;
    }
    if (from === Currency.USD && to === Currency.COP) {
      return this.usdToCop;
    }
    if (from === Currency.COP && to === Currency.USD) {
      return 1 / this.usdToCop;
    }
    throw new Error(`No hay tasa de cambio configurada para ${from} -> ${to}.`);
  }
}

function readUsdToCopRate(): number {
  const raw = Number(process.env.EXCHANGE_RATE_USD_COP);
  return Number.isFinite(raw) && raw > 0 ? raw : DEFAULT_USD_TO_COP;
}

/**
 * Monedas que el checkout acepta hoy. Se lee de `SUPPORTED_CURRENCIES` para
 * poder apagar USD en producción sin tocar código, pero siempre incluye la
 * moneda base: quedarse sin ninguna moneda válida dejaría el checkout muerto.
 */
export function readSupportedCurrencies(): Currency[] {
  const configured = (process.env.SUPPORTED_CURRENCIES ?? "")
    .split(",")
    .map((value) => value.trim().toUpperCase())
    .filter((value): value is Currency => value in Currency);

  return configured.includes(BASE_CURRENCY)
    ? configured
    : [BASE_CURRENCY, ...configured];
}
