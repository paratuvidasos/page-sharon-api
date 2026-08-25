import { Currency } from "../enums/Currency";

/**
 * [0041]: puerto para obtener la tasa de cambio vigente entre dos monedas.
 *
 * La tasa se resuelve una sola vez, al momento de confirmar la compra, y se
 * congela en la orden — el criterio de aceptación exige que el total se
 * calcule "usando la tasa de cambio vigente al momento de la compra", no la
 * del momento en que alguien consulte la orden después.
 *
 * Hoy la implementa `ConfiguredExchangeRateProvider` (tasa fija por `.env`).
 * Enchufar un proveedor real (TRM de la Superfinanciera, API externa con
 * caché) no debería tocar ningún caso de uso.
 */
export interface ExchangeRateProvider {
  /**
   * Cuántas unidades de `to` equivalen a una de `from`. Devuelve 1 cuando
   * ambas monedas son la misma.
   */
  getRate(from: Currency, to: Currency): Promise<number>;
}
