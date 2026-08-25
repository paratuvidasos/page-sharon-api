import { Router } from "express";
import { DataSource } from "typeorm";
import { RegisterUserForCheckout } from "../../../accounts/application/use-cases/registration/RegisterUserForCheckout";
import { LoginUser } from "../../../accounts/application/use-cases/session/LoginUser";
import { Currency } from "../../../shared-kernel/domain/enums/Currency";
import { PaymentApproved } from "../../../shared-kernel/domain/events/PaymentApproved";
import { PaymentRejected } from "../../../shared-kernel/domain/events/PaymentRejected";
import { UserAccountDeleted } from "../../../shared-kernel/domain/events/UserAccountDeleted";
import { EmailSender } from "../../../shared-kernel/domain/ports/EmailSender";
import { ExchangeRateProvider } from "../../../shared-kernel/domain/ports/ExchangeRateProvider";
import { domainEventBus } from "../../../shared-kernel/infrastructure/events/InMemoryDomainEventBus";
import { buildAuthenticate } from "../../../shared-kernel/infrastructure/http/authenticate.middleware";
import { buildOptionalAuthenticate } from "../../../shared-kernel/infrastructure/http/optional-authenticate.middleware";
import { JwtTokenService } from "../../../shared-kernel/infrastructure/security/JwtTokenService";
import { AnonymizeUserOrders } from "../../application/use-cases/AnonymizeUserOrders";
import { ConfirmOrderPayment } from "../../application/use-cases/ConfirmOrderPayment";
import { GetOrderByNumber } from "../../application/use-cases/GetOrderByNumber";
import { GetOrderHistory } from "../../application/use-cases/GetOrderHistory";
import { HasUserPurchasedProduct } from "../../application/use-cases/HasUserPurchasedProduct";
import { RejectOrderPayment } from "../../application/use-cases/RejectOrderPayment";
import { RetryOrderPayment } from "../../application/use-cases/RetryOrderPayment";
import { StartCheckout } from "../../application/use-cases/StartCheckout";
import { CatalogSnapshotPort } from "../../application/ports/CatalogSnapshotPort";
import { ClearCartPort } from "../../application/ports/CartPort";
import { CouponPort, RedeemCouponPort } from "../../application/ports/CouponPort";
import { CustomerContactPort } from "../../application/ports/CustomerContactPort";
import { PaymentSessionPort } from "../../application/ports/PaymentSessionPort";
import { ShippingAddressPort } from "../../application/ports/ShippingAddressPort";
import { ShippingQuotePort } from "../../application/ports/ShippingQuotePort";
import { ReserveStockPort, ResolveStockReservationPort } from "../../application/ports/StockReservationPort";
import { TypeOrmOrderQueryRepository } from "../persistence/typeorm-order-query.repository";
import { TypeOrmOrderRepository } from "../persistence/typeorm-order.repository";
import { OrdersController } from "./orders.controller";
import { buildOrdersRoutes } from "./orders.routes";

/**
 * Todo lo que `orders` necesita de otros módulos, siempre como puerto: nunca
 * recibe un repositorio ni una entidad de infraestructura ajena (regla 2 del
 * CLAUDE.md del repo).
 */
export interface OrdersModuleDependencies {
  catalogSnapshotPort: CatalogSnapshotPort;
  shippingAddressPort: ShippingAddressPort;
  customerContactPort: CustomerContactPort;
  shippingQuotePort: ShippingQuotePort;
  couponPort: CouponPort;
  redeemCouponPort: RedeemCouponPort;
  clearCartPort: ClearCartPort;
  reserveStockPort: ReserveStockPort;
  commitStockReservationPort: ResolveStockReservationPort;
  releaseStockReservationPort: ResolveStockReservationPort;
  paymentSessionPort: PaymentSessionPort;
  exchangeRateProvider: ExchangeRateProvider;
  emailSender: EmailSender;
  registerUserForCheckout: RegisterUserForCheckout;
  loginUser: LoginUser;
  supportedCurrencies: Currency[];
  reservationTtlMinutes: number;
}

export interface OrdersModule {
  router: Router;
  hasUserPurchasedProduct: HasUserPurchasedProduct;
}

export function buildOrdersModule(
  dataSource: DataSource,
  deps: OrdersModuleDependencies,
): OrdersModule {
  const orderQueryRepository = new TypeOrmOrderQueryRepository(dataSource);
  const orderRepository = new TypeOrmOrderRepository(dataSource);

  const getOrderHistory = new GetOrderHistory(orderQueryRepository, deps.customerContactPort);
  const getOrderByNumber = new GetOrderByNumber(orderRepository, deps.customerContactPort);
  const hasUserPurchasedProduct = new HasUserPurchasedProduct(orderQueryRepository);

  const startCheckout = new StartCheckout(
    orderRepository,
    deps.catalogSnapshotPort,
    deps.shippingAddressPort,
    deps.shippingQuotePort,
    deps.couponPort,
    deps.customerContactPort,
    deps.reserveStockPort,
    deps.paymentSessionPort,
    deps.exchangeRateProvider,
    deps.registerUserForCheckout,
    deps.loginUser,
    deps.supportedCurrencies,
    deps.reservationTtlMinutes,
  );

  const retryOrderPayment = new RetryOrderPayment(
    orderRepository,
    deps.catalogSnapshotPort,
    deps.reserveStockPort,
    deps.paymentSessionPort,
    deps.customerContactPort,
    deps.reservationTtlMinutes,
  );

  const confirmOrderPayment = new ConfirmOrderPayment(
    orderRepository,
    deps.commitStockReservationPort,
    deps.redeemCouponPort,
    deps.clearCartPort,
    deps.customerContactPort,
    deps.emailSender,
    domainEventBus,
  );
  const rejectOrderPayment = new RejectOrderPayment(orderRepository, deps.releaseStockReservationPort);

  // El resultado del cobro llega por evento, no por llamada directa: `payments`
  // no conoce este módulo (regla 3 del CLAUDE.md del repo).
  domainEventBus.subscribe(PaymentApproved.eventName, async (event) => {
    const approved = event as PaymentApproved;
    await confirmOrderPayment.execute({
      orderId: approved.orderId,
      paidAt: approved.occurredAt,
      paymentMethod: approved.paymentMethod,
    });
  });

  domainEventBus.subscribe(PaymentRejected.eventName, async (event) => {
    const rejected = event as PaymentRejected;
    await rejectOrderPayment.execute({
      orderId: rejected.orderId,
      reason: rejected.failureMessage,
    });
  });

  const anonymizeUserOrders = new AnonymizeUserOrders(orderRepository);
  domainEventBus.subscribe(UserAccountDeleted.eventName, async (event) => {
    await anonymizeUserOrders.execute({ userId: (event as UserAccountDeleted).userId });
  });

  const controller = new OrdersController(
    getOrderHistory,
    startCheckout,
    getOrderByNumber,
    retryOrderPayment,
  );

  const tokenService = new JwtTokenService(requireJwtSecret());
  const authenticate = buildAuthenticate(tokenService);
  const optionalAuthenticate = buildOptionalAuthenticate(tokenService);

  return {
    router: buildOrdersRoutes(controller, authenticate, optionalAuthenticate),
    hasUserPurchasedProduct,
  };
}

function requireJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET no está configurado.");
  }
  return secret;
}
