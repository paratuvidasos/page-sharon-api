import { GeoLocationProvider } from "../../domain/ports/GeoLocationProvider";
import { HttpGeoLocationProvider } from "./HttpGeoLocationProvider";
import { NullGeoLocationProvider } from "./NullGeoLocationProvider";

const DEFAULT_TIMEOUT_MS = 4000;

/**
 * [0070]: elige la implementación según el entorno.
 *
 * Sin `GEOIP_API_URL` o sin `GEOIP_API_KEY` se devuelve la implementación
 * nula y la sugerencia de idioma/moneda se degrada a `Accept-Language` —
 * mismo criterio que `buildCarrierRateProvider`: la falta de credenciales
 * degrada el servicio, no impide arrancar.
 */
export function buildGeoLocationProvider(): GeoLocationProvider {
  const apiUrl = process.env.GEOIP_API_URL;
  const apiKey = process.env.GEOIP_API_KEY;

  if (!apiUrl || !apiKey) {
    console.warn(
      "[localization] Sin GEOIP_API_URL/GEOIP_API_KEY: el idioma/moneda sugeridos salen de Accept-Language, no de la ubicación.",
    );
    return new NullGeoLocationProvider();
  }

  return new HttpGeoLocationProvider({ apiUrl, apiKey, timeoutMs: readTimeoutMs() });
}

function readTimeoutMs(): number {
  const raw = Number(process.env.GEOIP_TIMEOUT_MS);
  return Number.isFinite(raw) && raw > 0 ? raw : DEFAULT_TIMEOUT_MS;
}
