import { describe, expect, it, vi } from "vitest";
import { Order, OrderProps } from "../../domain/entities/Order";
import { OrderNotFoundException } from "../../domain/exceptions/OrderNotFoundException";
import { OrderStatus } from "../../domain/enums/OrderStatus";
import { OrderRepository } from "../../domain/repositories/OrderRepository";
import { Currency } from "../../../shared-kernel/domain/enums/Currency";
import { PaymentMethod } from "../../../shared-kernel/domain/enums/PaymentMethod";
import { CustomerContactPort } from "../ports/CustomerContactPort";
import { ShipmentTrackingPort, ShipmentTrackingView } from "../ports/ShipmentTrackingPort";
import { GetOrderByNumber } from "./GetOrderByNumber";

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

function buildContactPort(): CustomerContactPort {
  return { execute: vi.fn().mockResolvedValue({ email: "ana@example.com", fullName: "Ana" }) };
}

function buildTrackingPort(result: ShipmentTrackingView | Error): ShipmentTrackingPort {
  return {
    execute:
      result instanceof Error
        ? vi.fn().mockRejectedValue(result)
        : vi.fn().mockResolvedValue(result),
  };
}

describe("GetOrderByNumber", () => {
  it("lanza OrderNotFoundException si el pedido no existe", async () => {
    const useCase = new GetOrderByNumber(buildRepository(null), buildContactPort(), buildTrackingPort(new Error("no debería llamarse")));

    await expect(
      useCase.execute({ orderNumber: "ORD-X", authUserId: "user-1", guestEmail: null }),
    ).rejects.toThrow(OrderNotFoundException);
  });

  it("lanza OrderNotFoundException si quien consulta no es el dueño", async () => {
    const order = buildOrder({ userId: "user-1" });
    const useCase = new GetOrderByNumber(buildRepository(order), buildContactPort(), buildTrackingPort(new Error("no debería llamarse")));

    await expect(
      useCase.execute({ orderNumber: "ORD-1", authUserId: "user-2", guestEmail: null }),
    ).rejects.toThrow(OrderNotFoundException);
  });

  it("no consulta el tracking en tiempo real si el pedido no tiene envío", async () => {
    const order = buildOrder({ shipment: null });
    const trackingPort = buildTrackingPort(new Error("no debería llamarse"));
    const useCase = new GetOrderByNumber(buildRepository(order), buildContactPort(), trackingPort);

    const result = await useCase.execute({ orderNumber: "ORD-1", authUserId: "user-1", guestEmail: null });

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
    const useCase = new GetOrderByNumber(buildRepository(order), buildContactPort(), trackingPort);

    const result = await useCase.execute({ orderNumber: "ORD-1", authUserId: "user-1", guestEmail: null });

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
    const useCase = new GetOrderByNumber(buildRepository(order), buildContactPort(), trackingPort);

    const result = await useCase.execute({ orderNumber: "ORD-1", authUserId: "user-1", guestEmail: null });

    expect(result.realTimeTracking).toBeNull();
    expect(result.orderNumber).toBe("ORD-1");
  });
});
