import { DomainEvent } from "./DomainEvent";

export interface OrderPlacedItem {
  productId: string;
  quantity: number;
}

/**
 * Publicado por `orders` al confirmar un pedido. `catalog` lo escucha para
 * incrementar su propio contador de ventas por producto (`sales_count`) y
 * así poder ordenar el catálogo por "más vendidos" ([0019]) sin hacer un
 * join contra `order_items`, que pertenece a otro módulo (ver reglas 3 y 4
 * de arquitectura del CLAUDE.md del repo).
 */
export class OrderPlaced implements DomainEvent {
  static readonly eventName = "orders.order_placed";
  readonly eventName = OrderPlaced.eventName;
  readonly occurredAt: Date;

  constructor(
    public readonly orderId: string,
    public readonly items: OrderPlacedItem[],
  ) {
    this.occurredAt = new Date();
  }
}
