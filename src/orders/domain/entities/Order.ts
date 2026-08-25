import { Currency } from "../../../shared-kernel/domain/enums/Currency";
import { PaymentMethod } from "../../../shared-kernel/domain/enums/PaymentMethod";
import { OrderStatus } from "../enums/OrderStatus";
import { EmptyOrderItemsException } from "../exceptions/EmptyOrderItemsException";
import { InvalidOrderStatusTransitionException } from "../exceptions/InvalidOrderStatusTransitionException";
import { OrderMustHaveOwnerException } from "../exceptions/OrderMustHaveOwnerException";
import { ShipmentTrackingRequiredException } from "../exceptions/ShipmentTrackingRequiredException";

export interface OrderItemProps {
  productId: string;
  variantId: string;
  productName: string;
  sku: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}

/**
 * [0047]: datos del envío una vez despachado. `null` mientras el pedido no
 * haya salido.
 */
export interface OrderShipmentSnapshot {
  carrierCode: string;
  carrierName: string;
  trackingNumber: string;
  /** Enlace de rastreo de la transportadora, si la hay. */
  trackingUrl: string | null;
  shippedAt: Date;
  deliveredAt: Date | null;
}

/**
 * [0043]: una entrada por cada cambio de estado, con su fecha. Es lo que hace
 * visible "el pedido pasó a preparación el martes y salió el jueves" en vez de
 * solo el estado actual.
 */
export interface OrderStatusChange {
  status: OrderStatus;
  changedAt: Date;
  note: string | null;
}

export interface MarkShippedInput {
  carrierCode: string;
  carrierName: string;
  trackingNumber: string;
  trackingUrl: string | null;
  shippedAt: Date;
}

export interface ShippingAddressSnapshot {
  recipientName: string;
  phone: string;
  countryCode: string;
  stateProvince: string;
  city: string;
  postalCode: string;
  streetLine1: string;
  streetLine2: string | null;
}

export interface OrderProps {
  id: string;
  userId: string | null;
  guestEmail: string | null;
  orderNumber: string;
  status: OrderStatus;
  currency: Currency;
  /** Tasa contra la moneda base, congelada al momento de la compra ([0041]). */
  exchangeRate: number;
  items: OrderItemProps[];
  subtotal: number;
  couponCode: string | null;
  discount: number;
  shippingCost: number;
  total: number;
  shippingMethodCode: string;
  shippingMethodLabel: string;
  paymentMethod: PaymentMethod;
  paymentMethodLabel: string | null;
  /** [0040]: motivo del último rechazo, ya en lenguaje de usuario. */
  paymentFailureMessage: string | null;
  shippingAddress: ShippingAddressSnapshot;
  /** [0047]: guía y transportadora. `null` hasta que el pedido se despacha. */
  shipment: OrderShipmentSnapshot | null;
  /** [0043]: historial de estados, del más antiguo al más reciente. */
  statusHistory: OrderStatusChange[];
  placedAt: Date;
  paidAt: Date | null;
}

export interface PlaceOrderInput {
  id: string;
  orderNumber: string;
  userId: string | null;
  guestEmail: string | null;
  currency: Currency;
  exchangeRate: number;
  items: Array<{
    productId: string;
    variantId: string;
    productName: string;
    sku: string;
    unitPrice: number;
    quantity: number;
  }>;
  couponCode: string | null;
  discount: number;
  shippingCost: number;
  shippingMethodCode: string;
  shippingMethodLabel: string;
  paymentMethod: PaymentMethod;
  paymentMethodLabel: string | null;
  shippingAddress: ShippingAddressSnapshot;
  placedAt: Date;
}

export class Order {
  /**
   * Cambios de estado todavía no persistidos. El repositorio los vacía con
   * `pullNewStatusChanges()` dentro de la misma transacción en la que guarda
   * el pedido.
   *
   * Existe para que el historial no dependa de que cada caso de uso se acuerde
   * de escribirlo: cualquier transición del agregado lo alimenta sola, y una
   * transición nueva que se agregue mañana queda registrada sin tocar nada
   * más.
   */
  private newStatusChanges: OrderStatusChange[] = [];

  private constructor(private props: OrderProps) {}

  private recordStatusChange(status: OrderStatus, changedAt: Date, note: string | null): void {
    const change: OrderStatusChange = { status, changedAt, note };
    this.props.statusHistory = [...this.props.statusHistory, change];
    this.newStatusChanges.push(change);
  }

  /**
   * Un pedido debe tener exactamente un dueño: el usuario autenticado que lo
   * hizo, o el correo del invitado que lo hizo. Nunca ambos, nunca ninguno
   * (así se puede rastrear siempre, con o sin cuenta).
   *
   * Los totales se calculan acá y no se reciben: el precio unitario ya viene
   * revalidado contra el catálogo y el envío recotizado en el servidor, así
   * que dejar que el llamador pasara un total sería reabrir justo el agujero
   * que [0038] viene a cerrar.
   */
  static place(input: PlaceOrderInput): Order {
    if (input.items.length === 0) {
      throw new EmptyOrderItemsException();
    }

    if (!!input.userId === !!input.guestEmail) {
      throw new OrderMustHaveOwnerException();
    }

    const items: OrderItemProps[] = input.items.map((item) => ({
      ...item,
      lineTotal: item.unitPrice * item.quantity,
    }));

    const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
    // El descuento nunca puede dejar el subtotal en negativo ni comerse el
    // envío: se aplica solo sobre la mercancía.
    const discount = Math.min(Math.max(input.discount, 0), subtotal);
    const total = subtotal - discount + input.shippingCost;

    const order = new Order({
      id: input.id,
      userId: input.userId,
      guestEmail: input.guestEmail,
      orderNumber: input.orderNumber,
      status: OrderStatus.PENDING,
      currency: input.currency,
      exchangeRate: input.exchangeRate,
      items,
      subtotal,
      couponCode: input.couponCode,
      discount,
      shippingCost: input.shippingCost,
      total,
      shippingMethodCode: input.shippingMethodCode,
      shippingMethodLabel: input.shippingMethodLabel,
      paymentMethod: input.paymentMethod,
      paymentMethodLabel: input.paymentMethodLabel,
      paymentFailureMessage: null,
      shippingAddress: input.shippingAddress,
      shipment: null,
      statusHistory: [],
      placedAt: input.placedAt,
      paidAt: null,
    });

    order.recordStatusChange(OrderStatus.PENDING, input.placedAt, null);
    return order;
  }

  static reconstitute(props: OrderProps): Order {
    return new Order(props);
  }

  get id(): string {
    return this.props.id;
  }

  get orderNumber(): string {
    return this.props.orderNumber;
  }

  get status(): OrderStatus {
    return this.props.status;
  }

  get userId(): string | null {
    return this.props.userId;
  }

  get guestEmail(): string | null {
    return this.props.guestEmail;
  }

  get total(): number {
    return this.props.total;
  }

  get currency(): Currency {
    return this.props.currency;
  }

  get isPaid(): boolean {
    return this.props.status === OrderStatus.PAID;
  }

  /** [0039]: el pago se aprobó. Solo desde PENDING. */
  markPaid(paidAt: Date, paymentMethod: PaymentMethod | null): void {
    if (this.props.status !== OrderStatus.PENDING) {
      throw new InvalidOrderStatusTransitionException(this.props.status, OrderStatus.PAID);
    }
    this.props.status = OrderStatus.PAID;
    this.props.paidAt = paidAt;
    this.props.paymentFailureMessage = null;
    this.recordStatusChange(OrderStatus.PAID, paidAt, null);
    // La pasarela sabe con qué se pagó de verdad; lo que eligió el comprador
    // al abrir el checkout era solo una intención.
    if (paymentMethod) {
      this.props.paymentMethod = paymentMethod;
    }
  }

  /** [0040]: la pasarela rechazó el cobro. El pedido queda listo para reintentar. */
  markPaymentFailed(reason: string): void {
    if (this.props.status !== OrderStatus.PENDING) {
      throw new InvalidOrderStatusTransitionException(this.props.status, OrderStatus.PAYMENT_FAILED);
    }
    this.props.status = OrderStatus.PAYMENT_FAILED;
    this.props.paymentFailureMessage = reason;
    this.recordStatusChange(OrderStatus.PAYMENT_FAILED, new Date(), reason);
  }

  /**
   * [0040]: el comprador vuelve a intentar el pago, posiblemente con otro
   * método. Devuelve el pedido a PENDING conservando su número — para el
   * comprador es el mismo pedido, no uno nuevo.
   */
  retryPayment(paymentMethod: PaymentMethod, paymentMethodLabel: string | null): void {
    if (this.props.status !== OrderStatus.PAYMENT_FAILED) {
      throw new InvalidOrderStatusTransitionException(this.props.status, OrderStatus.PENDING);
    }
    this.props.status = OrderStatus.PENDING;
    this.props.paymentMethod = paymentMethod;
    this.props.paymentMethodLabel = paymentMethodLabel;
    this.props.paymentFailureMessage = null;
    this.recordStatusChange(OrderStatus.PENDING, new Date(), "Reintento de pago");
  }

  /**
   * [0047]: el pedido entra en preparación. Solo desde PAID — antes de que la
   * plata entre no se arma nada.
   */
  markInPreparation(changedAt: Date): void {
    if (this.props.status !== OrderStatus.PAID) {
      throw new InvalidOrderStatusTransitionException(this.props.status, OrderStatus.IN_PREPARATION);
    }
    this.props.status = OrderStatus.IN_PREPARATION;
    this.recordStatusChange(OrderStatus.IN_PREPARATION, changedAt, null);
  }

  /**
   * [0047]: el pedido sale, con su transportadora y su número de guía.
   *
   * Se acepta desde PAID y no solo desde IN_PREPARATION: para un pedido que se
   * despacha el mismo día, obligar a pasar por "en preparación" sería
   * burocracia sin información — el historial de estados igual deja constancia
   * de que no hubo esa etapa.
   */
  markShipped(input: MarkShippedInput): void {
    if (this.props.status !== OrderStatus.PAID && this.props.status !== OrderStatus.IN_PREPARATION) {
      throw new InvalidOrderStatusTransitionException(this.props.status, OrderStatus.SHIPPED);
    }
    if (!input.carrierCode.trim() || !input.carrierName.trim() || !input.trackingNumber.trim()) {
      throw new ShipmentTrackingRequiredException();
    }

    this.props.status = OrderStatus.SHIPPED;
    this.props.shipment = {
      carrierCode: input.carrierCode.trim(),
      carrierName: input.carrierName.trim(),
      trackingNumber: input.trackingNumber.trim(),
      trackingUrl: input.trackingUrl?.trim() ? input.trackingUrl.trim() : null,
      shippedAt: input.shippedAt,
      deliveredAt: null,
    };
    this.recordStatusChange(OrderStatus.SHIPPED, input.shippedAt, this.props.shipment.trackingNumber);
  }

  /** [0047]: el pedido llegó. Solo desde SHIPPED. */
  markDelivered(deliveredAt: Date): void {
    if (this.props.status !== OrderStatus.SHIPPED || !this.props.shipment) {
      throw new InvalidOrderStatusTransitionException(this.props.status, OrderStatus.DELIVERED);
    }
    this.props.status = OrderStatus.DELIVERED;
    this.props.shipment = { ...this.props.shipment, deliveredAt };
    this.recordStatusChange(OrderStatus.DELIVERED, deliveredAt, null);
  }

  get shipment(): OrderShipmentSnapshot | null {
    return this.props.shipment ? { ...this.props.shipment } : null;
  }

  /**
   * Devuelve los cambios de estado que todavía no se guardaron y los saca del
   * buffer. Lo llama el repositorio, una sola vez por guardado.
   */
  pullNewStatusChanges(): OrderStatusChange[] {
    const pending = this.newStatusChanges;
    this.newStatusChanges = [];
    return pending;
  }

  /** Líneas en la forma que necesita una reserva de stock. */
  reservationLines(): Array<{ productId: string; variantId: string; quantity: number }> {
    return this.props.items.map((item) => ({
      productId: item.productId,
      variantId: item.variantId,
      quantity: item.quantity,
    }));
  }

  toProps(): OrderProps {
    return {
      ...this.props,
      items: this.props.items.map((item) => ({ ...item })),
      shipment: this.props.shipment ? { ...this.props.shipment } : null,
      statusHistory: this.props.statusHistory.map((change) => ({ ...change })),
    };
  }
}
