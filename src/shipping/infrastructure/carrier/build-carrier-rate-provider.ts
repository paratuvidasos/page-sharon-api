import { CarrierRateProviderPort } from "../../domain/ports/CarrierRateProviderPort";
import { HttpCarrierRateProvider } from "./HttpCarrierRateProvider";
import { NullCarrierRateProvider } from "./NullCarrierRateProvider";

const DEFAULT_TIMEOUT_MS = 4000;

/**
 * [0048]: elige la implementación según el entorno.
 *
 * Sin `CARRIER_RATES_API_URL` o sin `CARRIER_API_KEY` se devuelve la
 * implementación nula y todo se cotiza con las tarifas configuradas a mano —
 * el mismo criterio de `buildPaymentGateway` y `buildEmailSender`: la falta de
 * credenciales degrada el servicio, no impide arrancar. Y a diferencia del
 * pago, acá no hay motivo para exigirlas en producción: la tarifa de respaldo
 * es un modo de operación legítimo, no una simulación.
 */
export function buildCarrierRateProvider(): CarrierRateProviderPort {
  const apiUrl = process.env.CARRIER_RATES_API_URL;
  const apiKey = process.env.CARRIER_API_KEY;

  if (!apiUrl || !apiKey) {
    console.warn(
      "[shipping] Sin CARRIER_RATES_API_URL/CARRIER_API_KEY: los envíos se cotizan con la tarifa de respaldo configurada en shipping_rates.",
    );
    return new NullCarrierRateProvider();
  }

  return new HttpCarrierRateProvider({
    apiUrl,
    apiKey,
    carrierCode: process.env.CARRIER_CODE ?? "CARRIER",
    carrierName: process.env.CARRIER_NAME ?? process.env.CARRIER_CODE ?? "Transportadora",
    timeoutMs: readTimeoutMs(),
  });
}

function readTimeoutMs(): number {
  const raw = Number(process.env.CARRIER_RATES_TIMEOUT_MS);
  return Number.isFinite(raw) && raw > 0 ? raw : DEFAULT_TIMEOUT_MS;
}
