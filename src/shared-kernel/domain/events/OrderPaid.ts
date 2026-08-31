import { DomainEvent } from "./DomainEvent";

export interface OrderPaidItem {
  productId: string;
  quantity: number;
}

/**
 * Publicado por `orders` cuando un pedido queda efectivamente pagado.
 *
 * Reemplaza a `OrderPlaced` como disparador del contador `sales_count` de
 * `catalog`: hasta la integración con la pasarela no existía flujo de pago y
 * "colocado" era lo más cerca de "vendido" que había, pero ahora un pedido
 * colocado puede quedarse sin pagar, y esos no son ventas.
 */
export class OrderPaid implements DomainEvent {
  static readonly eventName = "orders.order_paid";
  readonly eventName = OrderPaid.eventName;
  readonly occurredAt: Date;

  constructor(
    public readonly orderId: string,
    public readonly items: OrderPaidItem[],
  ) {
    this.occurredAt = new Date();
  }
}
