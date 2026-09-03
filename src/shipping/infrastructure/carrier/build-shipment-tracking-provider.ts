import { ShipmentTrackingProviderPort } from "../../domain/ports/ShipmentTrackingProviderPort";
import { HttpTrack123Provider } from "./HttpTrack123Provider";
import { NullTrackingProvider } from "./NullTrackingProvider";

const DEFAULT_TIMEOUT_MS = 8000;

/**
 * Sin `TRACK123_API_SECRET` o sin `TRACK123_COURIER_CODE`: no hay tracking
 * real y el sistema arranca igual — mismo criterio de degradación que
 * `buildCarrierRateProvider` ([0048]).
 */
export function buildShipmentTrackingProvider(): ShipmentTrackingProviderPort {
  const apiSecret = process.env.TRACK123_API_SECRET;
  const courierCode = process.env.TRACK123_COURIER_CODE;

  if (!apiSecret || !courierCode) {
    console.warn(
      "[shipping] Sin TRACK123_API_SECRET/TRACK123_COURIER_CODE: los envíos no se sincronizan con Track123.",
    );
    return new NullTrackingProvider();
  }

  return new HttpTrack123Provider({
    apiSecret,
    courierCode,
    timeoutMs: readTimeoutMs(),
  });
}

function readTimeoutMs(): number {
  const raw = Number(process.env.TRACK123_TIMEOUT_MS);
  return Number.isFinite(raw) && raw > 0 ? raw : DEFAULT_TIMEOUT_MS;
}
