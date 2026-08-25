import { CarrierRateProviderPort, CarrierRateQuote } from "../../domain/ports/CarrierRateProviderPort";

/**
 * [0048]: implementación que no consulta a nadie. Devolver la lista vacía
 * hace que `GetShippingOptions` use las tarifas configuradas a mano, que es
 * exactamente el comportamiento que tenía el sistema antes de esta US.
 *
 * Es el mismo patrón de `FakePaymentGateway` y `ConsoleEmailSender`: sin
 * credenciales configuradas, una implementación local en vez de un error de
 * arranque.
 */
export class NullCarrierRateProvider implements CarrierRateProviderPort {
  readonly carrierName = "sin transportadora";

  async getRates(): Promise<CarrierRateQuote[]> {
    return [];
  }
}
