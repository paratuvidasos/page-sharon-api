import { RegisterUserForCheckout } from "../../../accounts/application/use-cases/registration/RegisterUserForCheckout";
import { LoginUser, LoginUserResult } from "../../../accounts/application/use-cases/session/LoginUser";
import { EmailAlreadyRegisteredException } from "../../../accounts/domain/exceptions/registration/EmailAlreadyRegisteredException";
import { InvalidCredentialsException } from "../../../accounts/domain/exceptions/session/InvalidCredentialsException";
import { BASE_CURRENCY, Currency } from "../../../shared-kernel/domain/enums/Currency";
import { PaymentMethod } from "../../../shared-kernel/domain/enums/PaymentMethod";
import { convertAmount } from "../../../shared-kernel/domain/money";
import { ExchangeRateProvider } from "../../../shared-kernel/domain/ports/ExchangeRateProvider";
import { generateId } from "../../../shared-kernel/infrastructure/ids/generate-id";
import { Order, ShippingAddressSnapshot } from "../../domain/entities/Order";
import { CannotCreateAccountWhileAuthenticatedException } from "../../domain/exceptions/CannotCreateAccountWhileAuthenticatedException";
import { CheckoutAccountPasswordMismatchException } from "../../domain/exceptions/CheckoutAccountPasswordMismatchException";
import { EmptyOrderItemsException } from "../../domain/exceptions/EmptyOrderItemsException";
import { GuestEmailRequiredException } from "../../domain/exceptions/GuestEmailRequiredException";
import { UnsupportedCurrencyException } from "../../domain/exceptions/UnsupportedCurrencyException";
import { OrderRepository } from "../../domain/repositories/OrderRepository";
import { CheckoutLineInput, validateCheckoutLines } from "../checkout-validation";
import { generateOrderNumber } from "../order-number-generator";
import { CatalogSnapshotPort } from "../ports/CatalogSnapshotPort";
import { CouponPort } from "../ports/CouponPort";
import { CustomerContactPort } from "../ports/CustomerContactPort";
import { PaymentSession, PaymentSessionPort } from "../ports/PaymentSessionPort";
import { ShippingAddressPort } from "../ports/ShippingAddressPort";
import { ShippingQuotePort } from "../ports/ShippingQuotePort";
import { ShippingRestrictionPort } from "../ports/ShippingRestrictionPort";
import { ReserveStockPort } from "../ports/StockReservationPort";
import { buildOrderSummary, OrderSummary } from "../order-summary";

export interface StartCheckoutCreateAccountInput {
  firstName: string;
  lastName: string;
  password: string;
}

export interface StartCheckoutInput {
  authUserId: string | null;
  items: CheckoutLineInput[];
  /** Una de las dos: dirección guardada del usuario, o dirección escrita a mano. */
  shippingAddressId: string | null;
  shippingAddress: ShippingAddressSnapshot | null;
  shippingMethod: string;
  couponCode: string | null;
  currency: Currency;
  paymentMethod: PaymentMethod;
  paymentMethodLabel: string | null;
  guestEmail: string | null;
  documentNumber: string | null;
  createAccount: StartCheckoutCreateAccountInput | null;
}

export interface StartCheckoutResult {
  order: OrderSummary;
  payment: PaymentSession;
  account: LoginUserResult | null;
}

/**
 * [0038]: confirma un pedido y arranca su cobro.
 *
 * Reemplaza al `PlaceOrder` anterior, que creaba el pedido con los precios
 * que mandara el cliente y sin cobrar nada. El orden de los pasos importa:
 *
 *  1. Revalidar stock y precio contra el catálogo.
 *  2. Verificar que ningún producto esté restringido para la zona de destino
 *     ([0049]).
 *  3. Recotizar el envío en el servidor.
 *  4. Apartar el stock **antes** de crear el pedido: si no alcanza, no debe
 *     quedar ni rastro del pedido.
 *  5. Crear el pedido en PENDING.
 *  6. Pedirle a `payments` los parámetros firmados de la pasarela.
 *
 * Nada de lo que decide el monto viene del body: los precios salen del
 * catálogo, el descuento del cupón revalidado, y el envío de la tabla de
 * tarifas. El cliente solo dice qué variantes quiere, cuántas, a dónde y con
 * qué medio de pago.
 */
export class StartCheckout {
  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly catalogSnapshotPort: CatalogSnapshotPort,
    private readonly shippingAddressPort: ShippingAddressPort,
    private readonly shippingQuotePort: ShippingQuotePort,
    private readonly shippingRestrictionPort: ShippingRestrictionPort,
    private readonly couponPort: CouponPort,
    private readonly customerContactPort: CustomerContactPort,
    private readonly reserveStockPort: ReserveStockPort,
    private readonly paymentSessionPort: PaymentSessionPort,
    private readonly exchangeRateProvider: ExchangeRateProvider,
    private readonly registerUserForCheckout: RegisterUserForCheckout,
    private readonly loginUser: LoginUser,
    private readonly supportedCurrencies: Currency[],
    private readonly reservationTtlMinutes: number,
  ) {}

  async execute(input: StartCheckoutInput): Promise<StartCheckoutResult> {
    if (input.items.length === 0) {
      throw new EmptyOrderItemsException();
    }
    if (!this.supportedCurrencies.includes(input.currency)) {
      throw new UnsupportedCurrencyException(input.currency);
    }
    if (input.createAccount && input.authUserId) {
      throw new CannotCreateAccountWhileAuthenticatedException();
    }
    if (!input.authUserId && !input.guestEmail) {
      throw new GuestEmailRequiredException();
    }

    // La cuenta se crea antes de reservar stock: si el correo ya existe, el
    // checkout falla acá y no deja stock apartado por un pedido que no
    // llegó a nacer.
    const { userId, guestEmail, account } = await this.resolveOwner(input);

    const lines = await validateCheckoutLines(input.items, this.catalogSnapshotPort);
    const address = await this.resolveAddress(input, userId);

    // [0049]: antes de apartar stock. Un pedido que no se puede enviar a esa
    // zona no va a existir, y dejar producto reservado por él lo sacaría del
    // inventario hasta que venciera la reserva — el mismo motivo por el que
    // la cuenta se crea antes de reservar.
    await this.shippingRestrictionPort.execute({
      countryCode: address.countryCode,
      stateProvince: address.stateProvince,
      postalCode: address.postalCode,
      productIds: lines.map((line) => line.productId),
    });

    // Los precios del catálogo y los cupones están en la moneda base; la
    // conversión ocurre acá, una sola vez, con la tasa que se congela en el
    // pedido. El cupón se cotiza ANTES de convertir para que uno de monto
    // fijo (que está en pesos) descuente lo que debe, y su resultado se
    // convierte igual que todo lo demás.
    const exchangeRate = await this.exchangeRateProvider.getRate(BASE_CURRENCY, input.currency);
    const subtotalInBaseCurrency = lines.reduce(
      (sum, line) => sum + line.unitPrice * line.quantity,
      0,
    );

    const coupon = input.couponCode
      ? await this.couponPort.execute({ code: input.couponCode, subtotal: subtotalInBaseCurrency })
      : null;

    const chargedLines = lines.map((line) => ({
      ...line,
      unitPrice: convertAmount(line.unitPrice, exchangeRate),
    }));
    const discount = convertAmount(coupon?.discount ?? 0, exchangeRate);
    const subtotal = chargedLines.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0);
    const discountedSubtotal = subtotal - discount;

    const shipping = await this.shippingQuotePort.execute({
      countryCode: address.countryCode,
      stateProvince: address.stateProvince,
      postalCode: address.postalCode,
      subtotal: discountedSubtotal,
      currency: input.currency,
      method: input.shippingMethod,
      // [0048]: `shipping` resuelve el bulto contra el catálogo por su cuenta.
      // `orders` solo dice qué se está enviando; el peso nunca sale de acá,
      // porque entonces también podría salir del cliente.
      items: lines.map((line) => ({ variantId: line.variantId, quantity: line.quantity })),
    });

    const orderId = generateId();
    const expiresAt = new Date(Date.now() + this.reservationTtlMinutes * 60_000);

    await this.reserveStockPort.execute({
      referenceId: orderId,
      lines: lines.map((line) => ({
        productId: line.productId,
        variantId: line.variantId,
        quantity: line.quantity,
      })),
      expiresAt,
    });

    const order = Order.place({
      id: orderId,
      orderNumber: generateOrderNumber(),
      userId,
      guestEmail,
      currency: input.currency,
      exchangeRate,
      items: chargedLines,
      couponCode: coupon?.code ?? null,
      discount,
      shippingCost: shipping.cost,
      shippingMethodCode: shipping.method,
      shippingMethodLabel: shipping.label,
      paymentMethod: input.paymentMethod,
      paymentMethodLabel: input.paymentMethodLabel,
      shippingAddress: address,
      placedAt: new Date(),
    });

    await this.orderRepository.save(order);

    const props = order.toProps();
    const payment = await this.paymentSessionPort.execute({
      orderId: props.id,
      orderNumber: props.orderNumber,
      amount: props.total,
      currency: props.currency,
      paymentMethod: props.paymentMethod,
      description: `Pedido ${props.orderNumber} en Sharon`,
      customer: {
        ...(await this.resolveCustomerContact(userId, guestEmail, address.recipientName)),
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

    return { order: buildOrderSummary(order), payment, account };
  }

  private async resolveOwner(input: StartCheckoutInput): Promise<{
    userId: string | null;
    guestEmail: string | null;
    account: LoginUserResult | null;
  }> {
    if (input.createAccount) {
      return this.registerOrSignIn(input.guestEmail!, input.createAccount);
    }

    return input.authUserId
      ? { userId: input.authUserId, guestEmail: null, account: null }
      : { userId: null, guestEmail: input.guestEmail, account: null };
  }

  /**
   * Crea la cuenta que pidió el comprador; si el correo ya tiene una, intenta
   * entrar con la contraseña que escribió.
   *
   * Que el correo ya esté registrado no debería costarle la compra: hasta
   * ahora respondía 409 y había que abandonar el checkout, ir a iniciar
   * sesión y volver a llenar todo. Si la contraseña es la de esa cuenta, esto
   * es un inicio de sesión, no un error, y el pedido queda donde tiene que
   * quedar: en la cuenta de esa persona.
   *
   * Si no coincide, se corta con un mensaje que explica qué hacer. No es un
   * oráculo nuevo para adivinar contraseñas: `LoginUser` aplica el mismo
   * bloqueo por intentos fallidos que el login normal.
   */
  private async registerOrSignIn(
    email: string,
    createAccount: StartCheckoutCreateAccountInput,
  ): Promise<{ userId: string; guestEmail: null; account: LoginUserResult }> {
    try {
      const user = await this.registerUserForCheckout.execute({
        email,
        firstName: createAccount.firstName,
        lastName: createAccount.lastName,
        password: createAccount.password,
      });
      const account = await this.loginUser.execute({ email, password: createAccount.password });
      return { userId: user.id, guestEmail: null, account };
    } catch (error) {
      if (!(error instanceof EmailAlreadyRegisteredException)) {
        throw error;
      }
    }

    try {
      const account = await this.loginUser.execute({ email, password: createAccount.password });
      return { userId: account.user.id, guestEmail: null, account };
    } catch (error) {
      if (error instanceof InvalidCredentialsException) {
        throw new CheckoutAccountPasswordMismatchException();
      }
      // Cuenta bloqueada, inactiva o eliminada: esos errores ya explican por
      // sí solos qué pasó, y traducirlos acá los volvería más confusos.
      throw error;
    }
  }

  /**
   * [0033]: la dirección viene por id (guardada) o escrita a mano. Resolver
   * la guardada en el servidor evita que el cliente mande el id de una
   * dirección ajena — `GetAddressById` la busca dentro del usuario dueño.
   */
  private async resolveAddress(
    input: StartCheckoutInput,
    userId: string | null,
  ): Promise<ShippingAddressSnapshot> {
    if (input.shippingAddress) {
      return input.shippingAddress;
    }

    const resolved = await this.shippingAddressPort.execute({
      userId: userId!,
      addressId: input.shippingAddressId!,
    });

    return {
      recipientName: resolved.recipientName,
      phone: resolved.phone,
      countryCode: resolved.countryCode,
      stateProvince: resolved.stateProvince,
      city: resolved.city,
      postalCode: resolved.postalCode,
      streetLine1: resolved.line1,
      streetLine2: resolved.line2,
    };
  }

  /**
   * La pasarela necesita un correo real del pagador: es a donde Bold manda el
   * comprobante. Para un invitado es el que escribió; para alguien con
   * sesión, el de su cuenta.
   */
  private async resolveCustomerContact(
    userId: string | null,
    guestEmail: string | null,
    recipientName: string,
  ): Promise<{ email: string; fullName: string }> {
    if (guestEmail) {
      return { email: guestEmail, fullName: recipientName };
    }
    const contact = await this.customerContactPort.execute({ userId: userId! });
    return { email: contact.email, fullName: contact.fullName || recipientName };
  }
}
