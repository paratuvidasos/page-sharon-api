import { GeoLocationProvider } from "../../domain/ports/GeoLocationProvider";

export interface HttpGeoLocationConfig {
  apiUrl: string;
  apiKey: string;
  timeoutMs: number;
}

/**
 * Respuesta esperada del proveedor de geo-IP. **El proveedor concreto sigue
 * sin definir** (igual que la transportadora de [0048]), así que este es un
 * contrato genérico: la forma que comparten la mayoría de las APIs de geo-IP
 * del mercado (ipapi, MaxMind GeoLite vía wrapper HTTP, etc.).
 *
 * Cuando el equipo elija proveedor, lo único que hay que reescribir es este
 * bloque y `mapCountryCode` — ni el puerto ni `SuggestPreferences` se
 * enteran.
 */
interface GeoLocationApiResponse {
  country_code?: string;
  countryCode?: string;
}

/**
 * [0070]: resuelve el país de una IP contra un proveedor externo.
 *
 * Usa `AbortSignal.timeout` y no reintenta — misma decisión que
 * `HttpCarrierRateProvider`: la sugerencia de idioma/moneda es una mejora de
 * experiencia, no algo que valga la pena esperar ni reintentar. Si falla o
 * se demora, quien llama cae a `Accept-Language`.
 */
export class HttpGeoLocationProvider implements GeoLocationProvider {
  constructor(private readonly config: HttpGeoLocationConfig) {}

  async resolveCountry(ip: string): Promise<string | null> {
    const url = new URL(this.config.apiUrl);
    url.searchParams.set("ip", ip);

    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${this.config.apiKey}` },
      signal: AbortSignal.timeout(this.config.timeoutMs),
    });

    if (!response.ok) {
      throw new Error(`Proveedor de geo-IP respondió ${response.status} al resolver ${ip}.`);
    }

    const payload = (await response.json()) as GeoLocationApiResponse;
    return this.mapCountryCode(payload);
  }

  private mapCountryCode(payload: GeoLocationApiResponse): string | null {
    const raw = payload.country_code ?? payload.countryCode ?? null;
    if (!raw) return null;

    const normalized = raw.trim().toUpperCase();
    return /^[A-Z]{2}$/.test(normalized) ? normalized : null;
  }
}
