import { describe, expect, it } from "vitest";
import { Currency } from "../../../shared-kernel/domain/enums/Currency";
import { InvalidOrderStatusTransitionException } from "../exceptions/InvalidOrderStatusTransitionException";
import { OrderStatus } from "../enums/OrderStatus";
import { PaymentMethod } from "../enums/PaymentMethod";
import { Order, PlaceOrderInput } from "./Order";

function placeOrder(overrides: Partial<PlaceOrderInput> = {}): Order {
  const input: PlaceOrderInput = {
    id: "order-1",
    orderNumber: "ORD-20260101-AAAAAA",
    userId: "user-1",
    guestEmail: null,
    currency: Currency.COP,
    exchangeRate: 1,
    items: [
      {
        productId: "product-1",
        variantId: "variant-1",
        productName: "Shampoo",
        sku: "SHP-001",
        unitPrice: 10000,
        quantity: 2,
      },
    ],
    couponCode: null,
    discount: 0,
    shippingCost: 5000,
    shippingMethodCode: "STANDARD",
    shippingMethodLabel: "Envío estándar",
    paymentMethod: PaymentMethod.CREDIT_CARD,
    paymentMethodLabel: null,
    shippingAddress: {
      recipientName: "Sharon Gómez",
      phone: "+573001234567",
      countryCode: "CO",
      stateProvince: "Cundinamarca",
      city: "Bogotá",
      postalCode: "110111",
      streetLine1: "Calle 123 #45-67",
      streetLine2: null,
    },
    placedAt: new Date("2026-01-01T00:00:00.000Z"),
    ...overrides,
  };
  return Order.place(input);
}

describe("Order — cancel", () => {
  it.each([OrderStatus.PENDING, OrderStatus.PAID, OrderStatus.IN_PREPARATION])(
    "permite cancelar desde %s",
    (status) => {
      const order = placeOrder();
      advanceTo(order, status);

      order.cancel(new Date(), "el cliente pidió cancelar", "admin@sharon.com");

      expect(order.status).toBe(OrderStatus.CANCELLED);
    },
  );

  it.each([OrderStatus.SHIPPED, OrderStatus.DELIVERED])(
    "no permite cancelar desde %s — hay que reembolsar",
    (status) => {
      const order = placeOrder();
      advanceTo(order, status);

      expect(() => order.cancel(new Date(), "motivo", null)).toThrow(
        InvalidOrderStatusTransitionException,
      );
    },
  );

  it("registra el motivo y el admin en el historial de estados", () => {
    const order = placeOrder();
    order.cancel(new Date(), "cambio de dirección", "admin@sharon.com");

    const lastChange = order.toProps().statusHistory.at(-1);
    expect(lastChange?.note).toBe("cambio de dirección");
    expect(lastChange?.changedByAdminLabel).toBe("admin@sharon.com");
  });
});

describe("Order — refund", () => {
  it.each([OrderStatus.PAID, OrderStatus.IN_PREPARATION, OrderStatus.SHIPPED, OrderStatus.DELIVERED])(
    "permite reembolsar desde %s",
    (status) => {
      const order = placeOrder();
      advanceTo(order, status);

      order.refund(new Date(), "producto defectuoso", "admin@sharon.com");

      expect(order.status).toBe(OrderStatus.REFUNDED);
    },
  );

  it("no permite reembolsar un pedido que nunca se pagó (PENDING)", () => {
    const order = placeOrder();

    expect(() => order.refund(new Date(), "motivo", null)).toThrow(
      InvalidOrderStatusTransitionException,
    );
  });

  it("no permite reembolsar un pedido ya cancelado", () => {
    const order = placeOrder();
    order.cancel(new Date(), "motivo", null);

    expect(() => order.refund(new Date(), "motivo", null)).toThrow(
      InvalidOrderStatusTransitionException,
    );
  });
});

describe("Order.hadCommittedStock", () => {
  it("es true para estados de pedido ya pagado (reserva COMMITTED)", () => {
    expect(Order.hadCommittedStock(OrderStatus.PAID)).toBe(true);
    expect(Order.hadCommittedStock(OrderStatus.IN_PREPARATION)).toBe(true);
    expect(Order.hadCommittedStock(OrderStatus.SHIPPED)).toBe(true);
    expect(Order.hadCommittedStock(OrderStatus.DELIVERED)).toBe(true);
  });

  it("es false para PENDING/PAYMENT_FAILED (reserva todavía HELD o inexistente)", () => {
    expect(Order.hadCommittedStock(OrderStatus.PENDING)).toBe(false);
    expect(Order.hadCommittedStock(OrderStatus.PAYMENT_FAILED)).toBe(false);
  });
});

/** Avanza el pedido recién colocado (PENDING) hasta el estado pedido, pasando por las transiciones válidas. */
function advanceTo(order: Order, status: OrderStatus): void {
  if (status === OrderStatus.PENDING) {
    return;
  }
  order.markPaid(new Date(), null);
  if (status === OrderStatus.PAID) {
    return;
  }
  if (status === OrderStatus.IN_PREPARATION) {
    order.markInPreparation(new Date());
    return;
  }
  order.markShipped({
    carrierCode: "SERVIENTREGA",
    carrierName: "Servientrega",
    trackingNumber: "123456",
    trackingUrl: null,
    shippedAt: new Date(),
  });
  if (status === OrderStatus.SHIPPED) {
    return;
  }
  order.markDelivered(new Date());
}
