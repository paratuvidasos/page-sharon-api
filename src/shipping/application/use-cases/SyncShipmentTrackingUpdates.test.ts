import { describe, expect, it, vi } from "vitest";
import { ShipmentTracking } from "../../domain/entities/ShipmentTracking";
import { ShipmentTrackingStatus } from "../../domain/enums/ShipmentTrackingStatus";
import { ShipmentTrackingProviderPort } from "../../domain/ports/ShipmentTrackingProviderPort";
import { ShipmentTrackingRepository } from "../../domain/repositories/ShipmentTrackingRepository";
import { SyncShipmentTrackingUpdates } from "./SyncShipmentTrackingUpdates";

function tracking(trackingNumber: string): ShipmentTracking {
  return ShipmentTracking.register({
    id: `id-${trackingNumber}`,
    orderId: `order-${trackingNumber}`,
    carrierCode: "inter-rapidisimo-inter-rapidsimo",
    trackingNumber,
    createdAt: new Date("2026-09-01T00:00:00.000Z"),
  });
}

describe("SyncShipmentTrackingUpdates", () => {
  it("actualiza y guarda cada tracking activo con lo que devuelve el proveedor", async () => {
    const active = [tracking("111"), tracking("222")];
    const repository: ShipmentTrackingRepository = {
      save: vi.fn().mockResolvedValue(undefined),
      findByOrderId: vi.fn(),
      findActive: vi.fn().mockResolvedValue(active),
    };
    const provider: ShipmentTrackingProviderPort = {
      providerName: "fake",
      register: vi.fn(),
      query: vi.fn().mockResolvedValue({
        status: ShipmentTrackingStatus.IN_TRANSIT,
        events: [{ status: ShipmentTrackingStatus.IN_TRANSIT, description: "en tránsito", location: null, occurredAt: new Date() }],
      }),
    };

    const useCase = new SyncShipmentTrackingUpdates(repository, provider);
    await useCase.execute();

    expect(provider.query).toHaveBeenCalledTimes(2);
    expect(repository.save).toHaveBeenCalledTimes(2);
    expect(active[0].status).toBe(ShipmentTrackingStatus.IN_TRANSIT);
    expect(active[1].status).toBe(ShipmentTrackingStatus.IN_TRANSIT);
  });

  it("no guarda cuando el proveedor no tiene novedades (null)", async () => {
    const active = [tracking("111")];
    const repository: ShipmentTrackingRepository = {
      save: vi.fn().mockResolvedValue(undefined),
      findByOrderId: vi.fn(),
      findActive: vi.fn().mockResolvedValue(active),
    };
    const provider: ShipmentTrackingProviderPort = {
      providerName: "fake",
      register: vi.fn(),
      query: vi.fn().mockResolvedValue(null),
    };

    await new SyncShipmentTrackingUpdates(repository, provider).execute();

    expect(repository.save).not.toHaveBeenCalled();
  });

  it("un tracking que falla no interrumpe el resto del lote", async () => {
    const active = [tracking("111"), tracking("222")];
    const repository: ShipmentTrackingRepository = {
      save: vi.fn().mockResolvedValue(undefined),
      findByOrderId: vi.fn(),
      findActive: vi.fn().mockResolvedValue(active),
    };
    const provider: ShipmentTrackingProviderPort = {
      providerName: "fake",
      register: vi.fn(),
      query: vi
        .fn()
        .mockRejectedValueOnce(new Error("boom"))
        .mockResolvedValueOnce({
          status: ShipmentTrackingStatus.DELIVERED,
          events: [],
        }),
    };

    await new SyncShipmentTrackingUpdates(repository, provider).execute();

    expect(provider.query).toHaveBeenCalledTimes(2);
    expect(repository.save).toHaveBeenCalledTimes(1);
    expect(active[1].status).toBe(ShipmentTrackingStatus.DELIVERED);
  });
});
