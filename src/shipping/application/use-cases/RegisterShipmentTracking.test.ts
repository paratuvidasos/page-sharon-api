import { describe, expect, it, vi } from "vitest";
import { ShipmentTracking } from "../../domain/entities/ShipmentTracking";
import { ShipmentTrackingProviderPort } from "../../domain/ports/ShipmentTrackingProviderPort";
import { ShipmentTrackingRepository } from "../../domain/repositories/ShipmentTrackingRepository";
import { RegisterShipmentTracking } from "./RegisterShipmentTracking";

function buildRepository(): ShipmentTrackingRepository {
  return {
    save: vi.fn().mockResolvedValue(undefined),
    findByOrderId: vi.fn(),
    findActive: vi.fn(),
  };
}

function buildProvider(): ShipmentTrackingProviderPort {
  return {
    providerName: "fake",
    register: vi.fn().mockResolvedValue(undefined),
    query: vi.fn(),
  };
}

describe("RegisterShipmentTracking", () => {
  it("guarda el tracking local y lo registra en el proveedor", async () => {
    const repository = buildRepository();
    const provider = buildProvider();
    const useCase = new RegisterShipmentTracking(repository, provider);

    await useCase.execute({
      orderId: "order-1",
      carrierCode: "inter-rapidisimo-inter-rapidsimo",
      trackingNumber: "1234567890",
    });

    expect(repository.save).toHaveBeenCalledTimes(1);
    const saved = (repository.save as ReturnType<typeof vi.fn>).mock.calls[0][0] as ShipmentTracking;
    expect(saved.orderId).toBe("order-1");
    expect(saved.trackingNumber).toBe("1234567890");

    expect(provider.register).toHaveBeenCalledWith({
      trackingNumber: "1234567890",
      carrierCode: "inter-rapidisimo-inter-rapidsimo",
    });
  });

  it("guarda primero y recién después llama al proveedor", async () => {
    const calls: string[] = [];
    const repository = buildRepository();
    (repository.save as ReturnType<typeof vi.fn>).mockImplementation(async () => {
      calls.push("save");
    });
    const provider = buildProvider();
    (provider.register as ReturnType<typeof vi.fn>).mockImplementation(async () => {
      calls.push("register");
    });

    const useCase = new RegisterShipmentTracking(repository, provider);
    await useCase.execute({
      orderId: "order-1",
      carrierCode: "inter-rapidisimo-inter-rapidsimo",
      trackingNumber: "1234567890",
    });

    expect(calls).toEqual(["save", "register"]);
  });
});
