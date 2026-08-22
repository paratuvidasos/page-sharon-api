import { RegisterUserForCheckout } from "../../../accounts/application/use-cases/registration/RegisterUserForCheckout";
import { LoginUser, LoginUserResult } from "../../../accounts/application/use-cases/session/LoginUser";
import { OrderPlaced } from "../../../shared-kernel/domain/events/OrderPlaced";
import { DomainEventPublisher } from "../../../shared-kernel/domain/ports/DomainEventPublisher";
import { generateId } from "../../../shared-kernel/infrastructure/ids/generate-id";
import { Order, ShippingAddressSnapshot } from "../../domain/entities/Order";
import { OrderStatus } from "../../domain/enums/OrderStatus";
import { PaymentMethod } from "../../domain/enums/PaymentMethod";
import { CannotCreateAccountWhileAuthenticatedException } from "../../domain/exceptions/CannotCreateAccountWhileAuthenticatedException";
import { EmptyOrderItemsException } from "../../domain/exceptions/EmptyOrderItemsException";
import { GuestEmailRequiredException } from "../../domain/exceptions/GuestEmailRequiredException";
import { OrderRepository } from "../../domain/repositories/OrderRepository";
import { generateOrderNumber } from "../order-number-generator";

export interface PlaceOrderItemInput {
  productId: string;
  productName: string;
  sku: string;
  unitPrice: number;
  quantity: number;
}

export interface PlaceOrderCreateAccountInput {
  firstName: string;
  lastName: string;
  password: string;
}

export interface PlaceOrderInput {
  authUserId: string | null;
  items: PlaceOrderItemInput[];
  shippingCost: number;
  paymentMethod: PaymentMethod;
  paymentMethodLabel: string | null;
  shippingAddress: ShippingAddressSnapshot;
  guestEmail: string | null;
  createAccount: PlaceOrderCreateAccountInput | null;
}

export interface PlaceOrderResultItem {
  productId: string;
  productName: string;
  sku: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}

export interface PlaceOrderResult {
  order: {
    id: string;
    orderNumber: string;
    status: OrderStatus;
    currency: string;
    subtotal: number;
    shippingCost: number;
    total: number;
    paymentMethod: PaymentMethod;
    paymentMethodLabel: string | null;
    shippingAddress: ShippingAddressSnapshot;
    items: PlaceOrderResultItem[];
    placedAt: Date;
  };
  account: LoginUserResult | null;
}

export class PlaceOrder {
  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly registerUserForCheckout: RegisterUserForCheckout,
    private readonly loginUser: LoginUser,
    private readonly domainEventPublisher: DomainEventPublisher,
  ) {}

  async execute(input: PlaceOrderInput): Promise<PlaceOrderResult> {
    if (input.items.length === 0) {
      throw new EmptyOrderItemsException();
    }

    if (input.createAccount && input.authUserId) {
      throw new CannotCreateAccountWhileAuthenticatedException();
    }

    if (!input.authUserId && !input.guestEmail) {
      throw new GuestEmailRequiredException();
    }

    let userId = input.authUserId;
    let guestEmail: string | null = null;
    let account: LoginUserResult | null = null;

    if (input.createAccount) {
      const user = await this.registerUserForCheckout.execute({
        email: input.guestEmail!,
        firstName: input.createAccount.firstName,
        lastName: input.createAccount.lastName,
        password: input.createAccount.password,
      });
      account = await this.loginUser.execute({
        email: input.guestEmail!,
        password: input.createAccount.password,
      });
      userId = user.id;
    } else if (!userId) {
      guestEmail = input.guestEmail;
    }

    const order = Order.place({
      id: generateId(),
      orderNumber: generateOrderNumber(),
      userId,
      guestEmail,
      items: input.items,
      shippingCost: input.shippingCost,
      paymentMethod: input.paymentMethod,
      paymentMethodLabel: input.paymentMethodLabel,
      shippingAddress: input.shippingAddress,
      placedAt: new Date(),
    });

    await this.orderRepository.save(order);

    const props = order.toProps();

    await this.domainEventPublisher.publish(
      new OrderPlaced(
        props.id,
        props.items.map((item) => ({ productId: item.productId, quantity: item.quantity })),
      ),
    );

    return {
      order: {
        id: props.id,
        orderNumber: props.orderNumber,
        status: props.status,
        currency: props.currency,
        subtotal: props.subtotal,
        shippingCost: props.shippingCost,
        total: props.total,
        paymentMethod: props.paymentMethod,
        paymentMethodLabel: props.paymentMethodLabel,
        shippingAddress: props.shippingAddress,
        items: props.items,
        placedAt: props.placedAt,
      },
      account,
    };
  }
}
