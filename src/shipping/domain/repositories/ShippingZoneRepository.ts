import { ShippingZone } from "../entities/ShippingZone";

/**
 * [0049]: puerto de escritura del agregado `ShippingZone`. Sus tarifas y sus
 * restricciones de producto viajan dentro del agregado y se persisten en la
 * misma transacción de `save` — no tienen repositorio propio (ver "Repository
 * pattern" del CLAUDE.md del repo).
 *
 * Está separado de `ShippingRateQueryRepository`, que es el read model que usa
 * la cotización: uno hidrata el agregado para aplicarle invariantes, el otro
 * devuelve DTOs planos ya resueltos contra el destino.
 */
export interface ShippingZoneRepository {
  save(zone: ShippingZone): Promise<void>;

  findById(id: string): Promise<ShippingZone | null>;

  delete(id: string): Promise<void>;
}
