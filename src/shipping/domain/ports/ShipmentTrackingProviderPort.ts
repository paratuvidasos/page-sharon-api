import { ShipmentTrackingEvent } from "../entities/ShipmentTracking";
import { ShipmentTrackingStatus } from "../enums/ShipmentTrackingStatus";

export interface ShipmentTrackingQueryInput {
  trackingNumber: string;
  carrierCode: string;
}

export interface ShipmentTrackingQueryResult {
  status: ShipmentTrackingStatus;
  events: ShipmentTrackingEvent[];
}

/**
 * Consulta de estado real a la transportadora, vía un agregador de tracking
 * externo (Track123).
 *
 * Mismo criterio que `CarrierRateProviderPort` ([0048]): el contrato no
 * permite fallar de forma que tumbe algo. `register` no lanza — si el
 * proveedor está caído, el registro local queda igual y el próximo ciclo de
 * sync reintenta implícitamente. `query` devuelve `null` cuando no hay datos
 * todavía (guía recién creada, proveedor caído, guía no reconocida) en vez
 * de lanzar: un envío sin novedades reales no es un error.
 */
export interface ShipmentTrackingProviderPort {
  readonly providerName: string;

  register(input: ShipmentTrackingQueryInput): Promise<void>;

  query(input: ShipmentTrackingQueryInput): Promise<ShipmentTrackingQueryResult | null>;
}
