import { BASE_CURRENCY, Currency } from "../../../shared-kernel/domain/enums/Currency";
import { ExchangeRateProvider } from "../../../shared-kernel/domain/ports/ExchangeRateProvider";

export interface SupportedCurrencyItem {
  code: Currency;
  isBase: boolean;
  /** Cuántas unidades de esta moneda equivalen a una de `BASE_CURRENCY`. */
  rate: number;
}

export interface ListSupportedCurrenciesResult {
  currencies: SupportedCurrencyItem[];
  base: Currency;
  /**
   * [0068]: la tasa acá es solo para que el front estime un precio en la
   * moneda elegida — el cobro real se congela en el checkout con la tasa
   * vigente en ese momento ([0041]), no con esta.
   */
  estimated: true;
}

/**
 * [0068]: monedas que el selector del front debe ofrecer, con la tasa
 * vigente contra `BASE_CURRENCY` para recalcular precios en pantalla.
 */
export class ListSupportedCurrencies {
  constructor(
    private readonly supportedCurrencies: Currency[],
    private readonly exchangeRateProvider: ExchangeRateProvider,
  ) {}

  async execute(): Promise<ListSupportedCurrenciesResult> {
    const currencies = await Promise.all(
      this.supportedCurrencies.map(async (code) => ({
        code,
        isBase: code === BASE_CURRENCY,
        rate: await this.exchangeRateProvider.getRate(BASE_CURRENCY, code),
      })),
    );

    return { currencies, base: BASE_CURRENCY, estimated: true };
  }
}
