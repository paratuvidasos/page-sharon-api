import { OrderStatus } from "../enums/OrderStatus";
import { PaymentMethod } from "../enums/PaymentMethod";
import { EmptyOrderItemsException } from "../exceptions/EmptyOrderItemsException";
import { OrderMustHaveOwnerException } from "../exceptions/OrderMustHaveOwnerException";

export interface OrderItemProps {
  productId: string;
  productName: string;
  sku: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
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
  currency: string;
  items: OrderItemProps[];
  subtotal: number;
  shippingCost: number;
  total: number;
  paymentMethod: PaymentMethod;
  paymentMethodLabel: string | null;
  shippingAddress: ShippingAddressSnapshot;
  placedAt: Date;
}

export interface PlaceOrderInput {
  id: string;
  orderNumber: string;
  userId: string | null;
  guestEmail: string | null;
  currency?: string;
  items: Array<{
    productId: string;
    productName: string;
    sku: string;
    unitPrice: number;
    quantity: number;
  }>;
  shippingCost: number;
  paymentMethod: PaymentMethod;
  paymentMethodLabel: string | null;
  shippingAddress: ShippingAddressSnapshot;
  placedAt: Date;
}

export class Order {
  private constructor(private props: OrderProps) {}

  /**
   * Un pedido debe tener exactamente un dueño: el usuario autenticado que lo
   * hizo, o el correo del invitado que lo hizo. Nunca ambos, nunca ninguno
   * (así se puede rastrear siempre, con o sin cuenta).
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
    const total = subtotal + input.shippingCost;

    return new Order({
      id: input.id,
      userId: input.userId,
      guestEmail: input.guestEmail,
      orderNumber: input.orderNumber,
      status: OrderStatus.PENDING,
      currency: input.currency ?? "COP",
      items,
      subtotal,
      shippingCost: input.shippingCost,
      total,
      paymentMethod: input.paymentMethod,
      paymentMethodLabel: input.paymentMethodLabel,
      shippingAddress: input.shippingAddress,
      placedAt: input.placedAt,
    });
  }

  static reconstitute(props: OrderProps): Order {
    return new Order(props);
  }

  get id(): string {
    return this.props.id;
  }

  toProps(): OrderProps {
    return { ...this.props, items: this.props.items.map((item) => ({ ...item })) };
  }
}
