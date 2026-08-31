import { GeoLocationProvider } from "../../domain/ports/GeoLocationProvider";

/**
 * [0070]: implementación que no consulta a nadie. Sin país resuelto,
 * `SuggestPreferences` cae a `Accept-Language` y luego a los valores por
 * defecto — el mismo criterio de `NullCarrierRateProvider`.
 */
export class NullGeoLocationProvider implements GeoLocationProvider {
  async resolveCountry(): Promise<string | null> {
    return null;
  }
}
