import { OrderStatusChanged } from "../../../shared-kernel/domain/events/OrderStatusChanged";
import { DomainEventPublisher } from "../../../shared-kernel/domain/ports/DomainEventPublisher";
import { Order } from "../../domain/entities/Order";
import { OrderStatus } from "../../domain/enums/OrderStatus";
import { InvalidOrderStatusTransitionException } from "../../domain/exceptions/InvalidOrderStatusTransitionException";
import { OrderNotFoundException } from "../../domain/exceptions/OrderNotFoundException";
import { ShipmentTrackingRequiredException } from "../../domain/exceptions/ShipmentTrackingRequiredException";
import { CancellationReasonRequiredException } from "../../domain/exceptions/CancellationReasonRequiredException";
import { OrderRepository } from "../../domain/repositories/OrderRepository";
import { buildOrderSummary, OrderSummary } from "../order-summary";
import { CustomerContactPort } from "../ports/CustomerContactPort";
import { ResolveStockReservationPort } from "../ports/StockReservationPort";

/** Estados que el panel administrativo puede fijar. */
export type FulfillmentStatus =
  | OrderStatus.IN_PREPARATION
  | OrderStatus.SHIPPED
  | OrderStatus.DELIVERED
  | OrderStatus.CANCELLED
  | OrderStatus.REFUNDED;

export interface UpdateOrderFulfillmentStatusInput {
  orderNumber: string;
  status: FulfillmentStatus;
  /** Obligatorios al pasar a SHIPPED. */
  carrierCode?: string | null;
  carrierName?: string | null;
  trackingNumber?: string | null;
  trackingUrl?: string | null;
  /** Obligatorio al pasar a CANCELLED o REFUNDED ([0060]). */
  reason?: string | null;
  /** [0060]: email del admin autenticado, snapshot en el historial de estados. */
  adminLabel?: string | null;
}

/**
 * [0047]/[0060]: el administrador mueve el pedido por su ciclo de
 * cumplimiento, o lo cancela/reembolsa.
 *
 * Es un solo caso de uso para las cinco transiciones y no varios endpoints:
 * para el panel es la misma acción ("cambiar el estado del pedido"), y lo que
 * cambia entre una y otra —que enviar exige guía, que cancelar/reembolsar
 * exige motivo y puede tener que revertir stock— es una regla del dominio,
 * no de la capa HTTP.
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
    private readonly releaseStockReservationPort: ResolveStockReservationPort,
    private readonly reverseCommittedStockPort: ResolveStockReservationPort,
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
      case OrderStatus.CANCELLED:
        if (!input.reason?.trim()) {
          throw new CancellationReasonRequiredException();
        }
        order.cancel(changedAt, input.reason.trim(), input.adminLabel ?? null);
        break;
      case OrderStatus.REFUNDED:
        if (!input.reason?.trim()) {
          throw new CancellationReasonRequiredException();
        }
        order.refund(changedAt, input.reason.trim(), input.adminLabel ?? null);
        break;
      default:
        throw new InvalidOrderStatusTransitionException(previousStatus, input.status);
    }

    await this.orderRepository.update(order);

    if (input.status === OrderStatus.CANCELLED || input.status === OrderStatus.REFUNDED) {
      await this.releaseReservedStock(order.id, previousStatus);
    }

    await this.publishStatusChanged(order, previousStatus);

    return buildOrderSummary(order);
  }

  /**
   * [0060]: si la reserva ya estaba `COMMITTED` (el pedido llegó a pagarse),
   * hay que revertirla; si seguía `HELD` (pedido cancelado antes de pagar),
   * basta con liberarla — son caminos distintos en `catalog` porque una
   * reserva `COMMITTED` ya no aparece en el barrido de `HELD` que usa
   * `release`.
   */
  private async releaseReservedStock(orderId: string, previousStatus: OrderStatus): Promise<void> {
    if (Order.hadCommittedStock(previousStatus)) {
      await this.reverseCommittedStockPort.execute({ referenceId: orderId });
    } else {
      await this.releaseStockReservationPort.execute({ referenceId: orderId });
    }
  }

  /**
   * El evento se publica después de persistir: si algo falla al guardar, no
   * debe salir un correo diciendo que el pedido ya cambió de estado.
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
        props.shipment?.carrierCode ?? null,
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
