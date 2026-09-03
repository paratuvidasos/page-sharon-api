import { describe, expect, it, vi } from "vitest";
import { ShipmentTracking } from "../../domain/entities/ShipmentTracking";
import { ShipmentTrackingNotFoundException } from "../../domain/exceptions/ShipmentTrackingNotFoundException";
import { ShipmentTrackingRepository } from "../../domain/repositories/ShipmentTrackingRepository";
import { GetShipmentTrackingByOrderId } from "./GetShipmentTrackingByOrderId";

describe("GetShipmentTrackingByOrderId", () => {
  it("lanza ShipmentTrackingNotFoundException si el pedido no tiene tracking", async () => {
    const repository: ShipmentTrackingRepository = {
      save: vi.fn(),
      findByOrderId: vi.fn().mockResolvedValue(null),
      findActive: vi.fn(),
    };

    await expect(new GetShipmentTrackingByOrderId(repository).execute({ orderId: "order-1" })).rejects.toThrow(
      ShipmentTrackingNotFoundException,
    );
  });

  it("devuelve el estado y los eventos del tracking", async () => {
    const tracking = ShipmentTracking.register({
      id: "tracking-1",
      orderId: "order-1",
      carrierCode: "inter-rapidisimo-inter-rapidsimo",
      trackingNumber: "1234567890",
      createdAt: new Date("2026-09-01T00:00:00.000Z"),
    });

    const repository: ShipmentTrackingRepository = {
      save: vi.fn(),
      findByOrderId: vi.fn().mockResolvedValue(tracking),
      findActive: vi.fn(),
    };

    const result = await new GetShipmentTrackingByOrderId(repository).execute({ orderId: "order-1" });

    expect(result.status).toBe(tracking.status);
    expect(result.trackingNumber).toBe("1234567890");
    expect(result.carrierCode).toBe("inter-rapidisimo-inter-rapidsimo");
    expect(result.events).toEqual([]);
    expect(result.lastSyncedAt).toBeNull();
  });
});
