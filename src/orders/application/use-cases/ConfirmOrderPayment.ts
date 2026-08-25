import { OrderPaid } from "../../../shared-kernel/domain/events/OrderPaid";
import { PaymentMethod } from "../../../shared-kernel/domain/enums/PaymentMethod";
import { DomainEventPublisher } from "../../../shared-kernel/domain/ports/DomainEventPublisher";
import { EmailSender } from "../../../shared-kernel/domain/ports/EmailSender";
import { renderOrderConfirmationEmail } from "../../../shared-kernel/infrastructure/email/templates/order-confirmation.template";
import { Order } from "../../domain/entities/Order";
import { OrderRepository } from "../../domain/repositories/OrderRepository";
import { buildOrderSummary } from "../order-summary";
import { ClearCartPort } from "../ports/CartPort";
import { RedeemCouponPort } from "../ports/CouponPort";
import { CustomerContactPort } from "../ports/CustomerContactPort";
import { ResolveStockReservationPort } from "../ports/StockReservationPort";

export interface ConfirmOrderPaymentInput {
  orderId: string;
  paidAt: Date;
  paymentMethod: PaymentMethod | null;
}

/**
 * [0039]: el pago se aprobó. Cierra todo lo que quedaba abierto desde que se
 * confirmó el checkout.
 *
 * Es **idempotente**: si el pedido ya está pagado, no hace nada y sale. Bold
 * reintenta las notificaciones hasta cinco veces y puede reenviar una ya
 * procesada — sin esta guarda, un reenvío redimiría el cupón dos veces y
 * mandaría el correo repetido.
 *
 * Los efectos secundarios (cupón, carrito, correo) van después de persistir
 * el pedido y con su propio manejo de error: que falle el envío de un correo
 * no puede dejar un pedido pagado sin marcar como pagado.
 */
export class ConfirmOrderPayment {
  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly commitStockReservationPort: ResolveStockReservationPort,
    private readonly redeemCouponPort: RedeemCouponPort,
    private readonly clearCartPort: ClearCartPort,
    private readonly customerContactPort: CustomerContactPort,
    private readonly emailSender: EmailSender,
    private readonly domainEventPublisher: DomainEventPublisher,
  ) {}

  async execute(input: ConfirmOrderPaymentInput): Promise<void> {
    const order = await this.orderRepository.findById(input.orderId);
    if (!order || order.isPaid) {
      return;
    }

    order.markPaid(input.paidAt, input.paymentMethod);
    await this.orderRepository.update(order);
    await this.commitStockReservationPort.execute({ referenceId: order.id });

    const props = order.toProps();

    if (props.couponCode) {
      await this.redeemCouponPort.execute({ code: props.couponCode });
    }

    if (props.userId) {
      await this.clearCartPort.execute({ userId: props.userId });
    }

    await this.domainEventPublisher.publish(
      new OrderPaid(
        props.id,
        props.items.map((item) => ({ productId: item.productId, quantity: item.quantity })),
      ),
    );

    await this.sendConfirmationEmail(order);
  }

  /**
   * El correo es el último paso y no tumba la confirmación si falla: el pago
   * ya entró y el pedido ya existe. Perder el correo es molesto; perder el
   * pedido por un timeout del proveedor de correo, mucho peor.
   */
  private async sendConfirmationEmail(order: Order): Promise<void> {
    const props = order.toProps();
    const recipient = props.guestEmail ?? (await this.resolveUserEmail(props.userId));
    if (!recipient) {
      return;
    }

    try {
      await this.emailSender.send({
        to: recipient,
        subject: `Confirmamos tu pedido ${props.orderNumber}`,
        html: renderOrderConfirmationEmail(buildOrderSummary(order)),
      });
    } catch (error) {
      console.error(
        `[orders] No se pudo enviar el correo de confirmación del pedido ${props.orderNumber}:`,
        error,
      );
    }
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
