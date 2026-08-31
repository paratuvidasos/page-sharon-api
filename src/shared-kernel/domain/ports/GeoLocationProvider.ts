/**
 * [0070]: puerto para resolver el país de un visitante a partir de su IP.
 *
 * Hoy lo implementa `NullGeoLocationProvider` (sin proveedor configurado) o
 * `HttpGeoLocationProvider` (proveedor real por `.env`). Enchufar un
 * proveedor distinto no debería tocar ningún caso de uso.
 */
export interface GeoLocationProvider {
  /**
   * Código ISO 3166-1 alpha-2 en mayúsculas (ej. "CO"), o `null` si no se
   * pudo resolver — la IP es local/privada, el proveedor no respondió, o no
   * hay proveedor configurado.
   */
  resolveCountry(ip: string): Promise<string | null>;
}
