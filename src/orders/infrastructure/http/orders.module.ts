import { Router } from "express";
import { DataSource } from "typeorm";
import { RegisterUserForCheckout } from "../../../accounts/application/use-cases/registration/RegisterUserForCheckout";
import { LoginUser } from "../../../accounts/application/use-cases/session/LoginUser";
import { domainEventBus } from "../../../shared-kernel/infrastructure/events/InMemoryDomainEventBus";
import { UserAccountDeleted } from "../../../shared-kernel/domain/events/UserAccountDeleted";
import { buildAuthenticate } from "../../../shared-kernel/infrastructure/http/authenticate.middleware";
import { buildOptionalAuthenticate } from "../../../shared-kernel/infrastructure/http/optional-authenticate.middleware";
import { JwtTokenService } from "../../../shared-kernel/infrastructure/security/JwtTokenService";
import { AnonymizeUserOrders } from "../../application/use-cases/AnonymizeUserOrders";
import { GetOrderHistory } from "../../application/use-cases/GetOrderHistory";
import { PlaceOrder } from "../../application/use-cases/PlaceOrder";
import { TypeOrmOrderQueryRepository } from "../persistence/typeorm-order-query.repository";
import { TypeOrmOrderRepository } from "../persistence/typeorm-order.repository";
import { OrdersController } from "./orders.controller";
import { buildOrdersRoutes } from "./orders.routes";

export function buildOrdersModule(
  dataSource: DataSource,
  registerUserForCheckout: RegisterUserForCheckout,
  loginUser: LoginUser,
): Router {
  const orderQueryRepository = new TypeOrmOrderQueryRepository(dataSource);
  const orderRepository = new TypeOrmOrderRepository(dataSource);
  const getOrderHistory = new GetOrderHistory(orderQueryRepository);
  const placeOrder = new PlaceOrder(orderRepository, registerUserForCheckout, loginUser, domainEventBus);
  const controller = new OrdersController(getOrderHistory, placeOrder);

  const anonymizeUserOrders = new AnonymizeUserOrders(orderRepository);
  domainEventBus.subscribe(UserAccountDeleted.eventName, async (event) => {
    await anonymizeUserOrders.execute({ userId: (event as UserAccountDeleted).userId });
  });

  const tokenService = new JwtTokenService(requireJwtSecret());
  const authenticate = buildAuthenticate(tokenService);
  const optionalAuthenticate = buildOptionalAuthenticate(tokenService);

  return buildOrdersRoutes(controller, authenticate, optionalAuthenticate);
}

function requireJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET no está configurado.");
  }
  return secret;
}
