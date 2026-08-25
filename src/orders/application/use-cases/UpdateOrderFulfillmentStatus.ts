import { OrderStatusChanged } from "../../../shared-kernel/domain/events/OrderStatusChanged";
import { DomainEventPublisher } from "../../../shared-kernel/domain/ports/DomainEventPublisher";
import { Order } from "../../domain/entities/Order";
import { OrderStatus } from "../../domain/enums/OrderStatus";
import { InvalidOrderStatusTransitionException } from "../../domain/exceptions/InvalidOrderStatusTransitionException";
import { OrderNotFoundException } from "../../domain/exceptions/OrderNotFoundException";
import { ShipmentTrackingRequiredException } from "../../domain/exceptions/ShipmentTrackingRequiredException";
import { OrderRepository } from "../../domain/repositories/OrderRepository";
import { buildOrderSummary, OrderSummary } from "../order-summary";
import { CustomerContactPort } from "../ports/CustomerContactPort";

/** Estados de cumplimiento que el panel administrativo puede fijar. */
export type FulfillmentStatus =
  | OrderStatus.IN_PREPARATION
  | OrderStatus.SHIPPED
  | OrderStatus.DELIVERED;

export interface UpdateOrderFulfillmentStatusInput {
  orderNumber: string;
  status: FulfillmentStatus;
  /** Obligatorios al pasar a SHIPPED. */
  carrierCode?: string | null;
  carrierName?: string | null;
  trackingNumber?: string | null;
  trackingUrl?: string | null;
}

/**
 * [0047]: el administrador mueve el pedido por su ciclo de cumplimiento.
 *
 * Es un solo caso de uso para las tres transiciones y no tres endpoints: para
 * el panel es la misma acción ("cambiar el estado del pedido"), y lo que
 * cambia entre una y otra —que enviar exige guía y transportadora— es una
 * regla del dominio, no de la capa HTTP.
 *
 * El cambio se publica como evento y no se notifica desde acá: quién avisa y
 * por qué canal es problema de `notifications` ([0044]), y `orders` no tiene
 * por qué conocerlo (regla 3 del CLAUDE.md del repo).
 */
export class UpdateOrderFulfillmentStatus {
  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly customerContactPort: CustomerContactPort,
    private readonly domainEventPublisher: DomainEventPublisher,
  ) {}

  async execute(input: UpdateOrderFulfillmentStatusInput): Promise<OrderSummary> {
    const order = await this.orderRepository.findByOrderNumber(input.orderNumber);
    if (!order) {
      throw new OrderNotFoundException();
    }

    const previousStatus = order.status;
    const changedAt = new Date();

    switch (input.status) {
      case OrderStatus.IN_PREPARATION:
        order.markInPreparation(changedAt);
        break;
      case OrderStatus.SHIPPED:
        if (!input.carrierCode || !input.carrierName || !input.trackingNumber) {
          throw new ShipmentTrackingRequiredException();
        }
        order.markShipped({
          carrierCode: input.carrierCode,
          carrierName: input.carrierName,
          trackingNumber: input.trackingNumber,
          trackingUrl: input.trackingUrl ?? null,
          shippedAt: changedAt,
        });
        break;
      case OrderStatus.DELIVERED:
        order.markDelivered(changedAt);
        break;
      default:
        throw new InvalidOrderStatusTransitionException(previousStatus, input.status);
    }

    await this.orderRepository.update(order);

    await this.publishStatusChanged(order, previousStatus);

    return buildOrderSummary(order);
  }

  /**
   * El evento se publica después de persistir: si algo falla al guardar, no
   * debe salir un correo diciendo que el pedido ya se despachó.
   */
  private async publishStatusChanged(order: Order, previousStatus: OrderStatus): Promise<void> {
    const props = order.toProps();
    const recipientEmail = props.guestEmail ?? (await this.resolveUserEmail(props.userId));

    await this.domainEventPublisher.publish(
      new OrderStatusChanged(
        props.id,
        props.orderNumber,
        previousStatus,
        props.status,
        props.userId,
        recipientEmail,
        props.shipment?.carrierName ?? null,
        props.shipment?.trackingNumber ?? null,
        props.shipment?.trackingUrl ?? null,
      ),
    );
  }

  private async resolveUserEmail(userId: string | null): Promise<string | null> {
    if (!userId) {
      return null;
    }
    try {
      return (await this.customerContactPort.execute({ userId })).email;
    } catch {
      return null;
    }
  }
}
