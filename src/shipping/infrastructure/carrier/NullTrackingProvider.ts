import {
  ShipmentTrackingProviderPort,
  ShipmentTrackingQueryInput,
  ShipmentTrackingQueryResult,
} from "../../domain/ports/ShipmentTrackingProviderPort";

/**
 * Sin `TRACK123_API_SECRET`/`TRACK123_COURIER_CODE`: no se registra ni se
 * consulta nada, y el sistema arranca igual — mismo criterio que
 * `NullCarrierRateProvider` ([0048]).
 */
export class NullTrackingProvider implements ShipmentTrackingProviderPort {
  readonly providerName = "sin proveedor de tracking";

  async register(_input: ShipmentTrackingQueryInput): Promise<void> {}

  async query(_input: ShipmentTrackingQueryInput): Promise<ShipmentTrackingQueryResult | null> {
    return null;
  }
}
