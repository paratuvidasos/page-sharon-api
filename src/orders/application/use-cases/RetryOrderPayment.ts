import { PaymentMethod } from "../../../shared-kernel/domain/enums/PaymentMethod";
import { OrderStatus } from "../../domain/enums/OrderStatus";
import { InvalidOrderStatusTransitionException } from "../../domain/exceptions/InvalidOrderStatusTransitionException";
import { OrderNotFoundException } from "../../domain/exceptions/OrderNotFoundException";
import { OrderRepository } from "../../domain/repositories/OrderRepository";
import { validateCheckoutLines } from "../checkout-validation";
import { canAccessOrder } from "../order-access";
import { buildOrderSummary, OrderSummary } from "../order-summary";
import { CatalogSnapshotPort } from "../ports/CatalogSnapshotPort";
import { CustomerContactPort } from "../ports/CustomerContactPort";
import { PaymentSession, PaymentSessionPort } from "../ports/PaymentSessionPort";
import { ReserveStockPort } from "../ports/StockReservationPort";

export interface RetryOrderPaymentInput {
  orderNumber: string;
  /** Quién pide el reintento: dueño autenticado, o invitado que prueba con su correo. */
  authUserId: string | null;
  guestEmail: string | null;
  paymentMethod: PaymentMethod;
  paymentMethodLabel: string | null;
  documentNumber: string | null;
}

export interface RetryOrderPaymentResult {
  order: OrderSummary;
  payment: PaymentSession;
}

/**
 * [0040]: reintenta el cobro de un pedido cuyo pago falló, con la opción de
 * cambiar de método de pago.
 *
 * El pedido conserva su número y todos sus datos — para el comprador es el
 * mismo pedido, no uno nuevo, y ese es justamente el punto de la US: no tener
 * que volver a llenar nada.
 *
 * Lo que sí es nuevo es la reserva de stock (se liberó al rechazarse el pago,
 * así que hay que volver a apartarla y puede que ya no alcance) y la
 * referencia del intento, porque la pasarela rechaza referencias repetidas.
 * También se revalida el precio: entre el rechazo y el reintento puede haber
 * pasado bastante tiempo.
 */
export class RetryOrderPayment {
  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly catalogSnapshotPort: CatalogSnapshotPort,
    private readonly reserveStockPort: ReserveStockPort,
    private readonly paymentSessionPort: PaymentSessionPort,
    private readonly customerContactPort: CustomerContactPort,
    private readonly reservationTtlMinutes: number,
  ) {}

  async execute(input: RetryOrderPaymentInput): Promise<RetryOrderPaymentResult> {
    const order = await this.orderRepository.findByOrderNumber(input.orderNumber);

    // Igual que en la consulta: con sesión, el correo de la cuenta prueba la
    // propiedad de un pedido hecho como invitado con ese mismo correo.
    const provedEmail = input.authUserId
      ? (await this.customerContactPort.execute({ userId: input.authUserId })).email
      : input.guestEmail;

    if (!order || !canAccessOrder(order.userId, order.guestEmail, input.authUserId, provedEmail)) {
      // Se responde igual que si no existiera: confirmar la existencia de un
      // pedido ajeno le diría a un desconocido que ese número es válido.
      throw new OrderNotFoundException();
    }

    if (order.status !== OrderStatus.PAYMENT_FAILED) {
      throw new InvalidOrderStatusTransitionException(order.status, OrderStatus.PENDING);
    }

    const props = order.toProps();

    await validateCheckoutLines(
      props.items.map((item) => ({ variantId: item.variantId, quantity: item.quantity })),
      this.catalogSnapshotPort,
    );

    const expiresAt = new Date(Date.now() + this.reservationTtlMinutes * 60_000);
    await this.reserveStockPort.execute({
      referenceId: order.id,
      lines: order.reservationLines(),
      expiresAt,
    });

    order.retryPayment(input.paymentMethod, input.paymentMethodLabel);
    await this.orderRepository.update(order);

    const address = props.shippingAddress;
    const payment = await this.paymentSessionPort.execute({
      orderId: props.id,
      orderNumber: props.orderNumber,
      amount: props.total,
      currency: props.currency,
      paymentMethod: input.paymentMethod,
      description: `Pedido ${props.orderNumber} en Sharon`,
      customer: {
        email: props.guestEmail ?? (await this.customerContactPort.execute({ userId: props.userId! })).email,
        fullName: address.recipientName,
        phone: address.phone,
        documentNumber: input.documentNumber,
      },
      billingAddress: {
        address: [address.streetLine1, address.streetLine2].filter(Boolean).join(", "),
        city: address.city,
        state: address.stateProvince,
        zipCode: address.postalCode,
        country: address.countryCode,
      },
    });

    return { order: buildOrderSummary(order), payment };
  }
}

