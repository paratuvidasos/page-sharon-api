import { ShipmentTrackingEvent } from "../../domain/entities/ShipmentTracking";
import { ShipmentTrackingStatus } from "../../domain/enums/ShipmentTrackingStatus";
import {
  ShipmentTrackingProviderPort,
  ShipmentTrackingQueryInput,
  ShipmentTrackingQueryResult,
} from "../../domain/ports/ShipmentTrackingProviderPort";

export interface Track123Config {
  apiSecret: string;
  courierCode: string;
  timeoutMs: number;
}

const BASE_URL = "https://api.track123.com/gateway/open-api";

interface Track123TrackingDetail {
  address?: string;
  eventDetail?: string;
  eventTimeZeroUTC?: string;
  transitSubStatus?: string;
}

interface Track123QueryRealtimeResponse {
  code: string;
  data?: {
    accepted?: {
      transitStatus?: string;
      localLogisticsInfo?: {
        trackingDetails?: Track123TrackingDetail[];
      };
    };
  };
}

/**
 * Implementación real del puerto, contra
 * `https://api.track123.com/gateway/open-api` (confirmado explorando la API
 * real vía el servidor MCP de documentación de Track123, no un supuesto de
 * la documentación — ver el spec de esta integración).
 *
 * Mismo criterio que `HttpCarrierRateProvider` ([0048]): usa timeout propio
 * y nunca deja que un error de red se propague como excepción — `register`
 * y `query` atrapan su propio error y degradan (no-op / `null`), porque una
 * transportadora externa caída no puede tumbar el registro de un envío ni
 * la sincronización del resto del lote.
 */
export class HttpTrack123Provider implements ShipmentTrackingProviderPort {
  readonly providerName = "Track123";

  constructor(private readonly config: Track123Config) {}

  async register(input: ShipmentTrackingQueryInput): Promise<void> {
    try {
      const response = await fetch(`${BASE_URL}/tk/v2.1/track/import`, {
        method: "POST",
        headers: this.headers(),
        body: JSON.stringify([{ trackNo: input.trackingNumber, courierCode: this.config.courierCode }]),
        signal: AbortSignal.timeout(this.config.timeoutMs),
      });

      if (!response.ok) {
        throw new Error(`Track123 respondió ${response.status} al registrar el tracking.`);
      }
    } catch (error) {
      console.error(
        `[shipping] No se pudo registrar el tracking ${input.trackingNumber} en Track123:`,
        error,
      );
    }
  }

  async query(input: ShipmentTrackingQueryInput): Promise<ShipmentTrackingQueryResult | null> {
    try {
      const response = await fetch(`${BASE_URL}/tk/v2.1/track/query-realtime`, {
        method: "POST",
        headers: this.headers(),
        body: JSON.stringify({ trackNo: input.trackingNumber, courierCode: this.config.courierCode }),
        signal: AbortSignal.timeout(this.config.timeoutMs),
      });

      if (!response.ok) {
        throw new Error(`Track123 respondió ${response.status} al consultar el tracking.`);
      }

      const payload = (await response.json()) as Track123QueryRealtimeResponse;
      const accepted = payload.data?.accepted;
      if (!accepted) {
        return null;
      }

      return {
        status: mapStatus(accepted.transitStatus),
        events: (accepted.localLogisticsInfo?.trackingDetails ?? []).map(mapEvent),
      };
    } catch (error) {
      console.error(
        `[shipping] No se pudo consultar el tracking ${input.trackingNumber} en Track123:`,
        error,
      );
      return null;
    }
  }

  private headers(): Record<string, string> {
    return {
      "Content-Type": "application/json",
      "Track123-Api-Secret": this.config.apiSecret,
    };
  }
}

/**
 * Vocabulario de Track123 (`transitStatus`) mapeado al enum propio — nunca
 * se expone el vocabulario del proveedor hacia afuera. Cualquier valor que
 * Track123 agregue en el futuro cae en `UNKNOWN` en vez de romper el mapeo.
 */
function mapStatus(transitStatus: string | undefined): ShipmentTrackingStatus {
  switch (transitStatus) {
    case "INFO_RECEIVED":
      return ShipmentTrackingStatus.PENDING;
    case "IN_TRANSIT":
      return ShipmentTrackingStatus.IN_TRANSIT;
    case "OUT_FOR_DELIVERY":
      return ShipmentTrackingStatus.OUT_FOR_DELIVERY;
    case "DELIVERED":
      return ShipmentTrackingStatus.DELIVERED;
    case "EXCEPTION":
    case "EXPIRED":
    case "FAILED_ATTEMPT":
      return ShipmentTrackingStatus.EXCEPTION;
    default:
      return ShipmentTrackingStatus.UNKNOWN;
  }
}

function mapEvent(detail: Track123TrackingDetail): ShipmentTrackingEvent {
  // "IN_TRANSIT_01" -> "IN_TRANSIT", "DELIVERED_01" -> "DELIVERED".
  const normalizedSubStatus = detail.transitSubStatus?.replace(/_\d+$/, "");
  return {
    status: mapStatus(normalizedSubStatus),
    description: detail.eventDetail?.trim() || "Sin descripción",
    location: detail.address?.trim() || null,
    occurredAt: detail.eventTimeZeroUTC ? new Date(detail.eventTimeZeroUTC) : new Date(),
  };
}
