import { describe, expect, it, vi } from "vitest";
import { Currency } from "../../../shared-kernel/domain/enums/Currency";
import { PaymentMethod } from "../../../shared-kernel/domain/enums/PaymentMethod";
import { Order, OrderProps } from "../../domain/entities/Order";
import { OrderStatus } from "../../domain/enums/OrderStatus";
import { OrderNotFoundException } from "../../domain/exceptions/OrderNotFoundException";
import { OrderRepository } from "../../domain/repositories/OrderRepository";
import { ShipmentTrackingPort, ShipmentTrackingView } from "../ports/ShipmentTrackingPort";
import { AdminGetOrderByNumber } from "./AdminGetOrderByNumber";

function buildOrder(overrides: Partial<OrderProps> = {}): Order {
  const props: OrderProps = {
    id: "order-1",
    userId: "user-1",
    guestEmail: null,
    orderNumber: "ORD-1",
    status: OrderStatus.PAID,
    currency: Currency.COP,
    exchangeRate: 1,
    items: [],
    subtotal: 100000,
    couponCode: null,
    discount: 0,
    shippingCost: 10000,
    total: 110000,
    shippingMethodCode: "STANDARD",
    shippingMethodLabel: "Envío estándar",
    paymentMethod: PaymentMethod.CARD,
    paymentMethodLabel: null,
    paymentFailureMessage: null,
    shippingAddress: {
      recipientName: "Ana",
      phone: "3000000000",
      countryCode: "CO",
      stateProvince: "Cundinamarca",
      city: "Bogotá",
      postalCode: "110111",
      streetLine1: "Calle 1",
      streetLine2: null,
    },
    shipment: null,
    statusHistory: [],
    placedAt: new Date("2026-09-01T00:00:00.000Z"),
    paidAt: new Date("2026-09-01T00:00:00.000Z"),
    ...overrides,
  };
  return Order.reconstitute(props);
}

function buildRepository(order: Order | null): OrderRepository {
  return {
    save: vi.fn(),
    findByOrderNumber: vi.fn().mockResolvedValue(order),
  } as unknown as OrderRepository;
}

function buildTrackingPort(result: ShipmentTrackingView | Error): ShipmentTrackingPort {
  return {
    execute:
      result instanceof Error
        ? vi.fn().mockRejectedValue(result)
        : vi.fn().mockResolvedValue(result),
  };
}

describe("AdminGetOrderByNumber", () => {
  it("lanza OrderNotFoundException si el pedido no existe", async () => {
    const useCase = new AdminGetOrderByNumber(buildRepository(null), buildTrackingPort(new Error("no debería llamarse")));

    await expect(useCase.execute({ orderNumber: "ORD-X" })).rejects.toThrow(OrderNotFoundException);
  });

  it("no verifica dueño: cualquier pedido existente se devuelve", async () => {
    const order = buildOrder({ userId: "otro-usuario" });
    const useCase = new AdminGetOrderByNumber(buildRepository(order), buildTrackingPort(new Error("no debería llamarse")));

    const result = await useCase.execute({ orderNumber: "ORD-1" });

    expect(result.orderNumber).toBe("ORD-1");
  });

  it("no consulta el tracking en tiempo real si el pedido no tiene envío", async () => {
    const order = buildOrder({ shipment: null });
    const trackingPort = buildTrackingPort(new Error("no debería llamarse"));
    const useCase = new AdminGetOrderByNumber(buildRepository(order), trackingPort);

    const result = await useCase.execute({ orderNumber: "ORD-1" });

    expect(trackingPort.execute).not.toHaveBeenCalled();
    expect(result.realTimeTracking).toBeNull();
  });

  it("agrega el tracking en tiempo real cuando el pedido ya tiene envío", async () => {
    const order = buildOrder({
      status: OrderStatus.SHIPPED,
      shipment: {
        carrierCode: "inter-rapidisimo-inter-rapidsimo",
        carrierName: "Inter Rapidísimo",
        trackingNumber: "123456",
        trackingUrl: null,
        shippedAt: new Date("2026-09-02T00:00:00.000Z"),
        deliveredAt: null,
      },
    });
    const tracking: ShipmentTrackingView = {
      status: "IN_TRANSIT",
      carrierCode: "inter-rapidisimo-inter-rapidsimo",
      trackingNumber: "123456",
      events: [{ status: "IN_TRANSIT", description: "En tránsito", location: "Bogotá", occurredAt: new Date() }],
      lastSyncedAt: new Date("2026-09-03T00:00:00.000Z"),
    };
    const trackingPort = buildTrackingPort(tracking);
    const useCase = new AdminGetOrderByNumber(buildRepository(order), trackingPort);

    const result = await useCase.execute({ orderNumber: "ORD-1" });

    expect(trackingPort.execute).toHaveBeenCalledWith({ orderId: "order-1" });
    expect(result.realTimeTracking).toEqual(tracking);
  });

  it("no falla si el puerto de tracking rechaza (ej. todavía no hay registro)", async () => {
    const order = buildOrder({
      status: OrderStatus.SHIPPED,
      shipment: {
        carrierCode: "inter-rapidisimo-inter-rapidsimo",
        carrierName: "Inter Rapidísimo",
        trackingNumber: "123456",
        trackingUrl: null,
        shippedAt: new Date("2026-09-02T00:00:00.000Z"),
        deliveredAt: null,
      },
    });
    const trackingPort = buildTrackingPort(new Error("todavía no hay tracking"));
    const useCase = new AdminGetOrderByNumber(buildRepository(order), trackingPort);

    const result = await useCase.execute({ orderNumber: "ORD-1" });

    expect(result.realTimeTracking).toBeNull();
    expect(result.orderNumber).toBe("ORD-1");
  });
});
