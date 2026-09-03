import { describe, expect, it } from "vitest";
import { ShipmentTrackingStatus } from "../enums/ShipmentTrackingStatus";
import { InvalidShipmentTrackingException } from "../exceptions/InvalidShipmentTrackingException";
import { ShipmentTracking } from "./ShipmentTracking";

function registerTracking(overrides: Partial<Parameters<typeof ShipmentTracking.register>[0]> = {}) {
  return ShipmentTracking.register({
    id: "tracking-1",
    orderId: "order-1",
    carrierCode: "inter-rapidisimo-inter-rapidsimo",
    trackingNumber: "1234567890",
    createdAt: new Date("2026-09-03T00:00:00.000Z"),
    ...overrides,
  });
}

describe("ShipmentTracking.register", () => {
  it("nace en PENDING sin eventos", () => {
    const tracking = registerTracking();
    expect(tracking.status).toBe(ShipmentTrackingStatus.PENDING);
    expect(tracking.toProps().events).toEqual([]);
  });

  it("rechaza un número de guía vacío", () => {
    expect(() => registerTracking({ trackingNumber: "   " })).toThrow(
      InvalidShipmentTrackingException,
    );
  });

  it("rechaza un código de transportadora vacío", () => {
    expect(() => registerTracking({ carrierCode: "" })).toThrow(InvalidShipmentTrackingException);
  });

  it("recorta espacios de la guía y la transportadora", () => {
    const tracking = registerTracking({ trackingNumber: "  9999  ", carrierCode: "  dhl  " });
    expect(tracking.trackingNumber).toBe("9999");
    expect(tracking.carrierCode).toBe("dhl");
  });
});

describe("ShipmentTracking.applySync", () => {
  it("reemplaza estado, eventos y marca la hora de sincronización", () => {
    const tracking = registerTracking();
    const syncedAt = new Date("2026-09-04T10:00:00.000Z");

    tracking.applySync(
      ShipmentTrackingStatus.IN_TRANSIT,
      [
        {
          status: ShipmentTrackingStatus.IN_TRANSIT,
          description: "En tránsito",
          location: "Bogotá",
          occurredAt: new Date("2026-09-03T12:00:00.000Z"),
        },
      ],
      syncedAt,
    );

    const props = tracking.toProps();
    expect(props.status).toBe(ShipmentTrackingStatus.IN_TRANSIT);
    expect(props.events).toHaveLength(1);
    expect(props.lastSyncedAt).toEqual(syncedAt);
  });
});
