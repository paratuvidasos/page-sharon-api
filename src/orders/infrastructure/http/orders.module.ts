import { Router } from "express";
import { DataSource } from "typeorm";
import { domainEventBus } from "../../../shared-kernel/infrastructure/events/InMemoryDomainEventBus";
import { UserAccountDeleted } from "../../../shared-kernel/domain/events/UserAccountDeleted";
import { buildAuthenticate } from "../../../shared-kernel/infrastructure/http/authenticate.middleware";
import { JwtTokenService } from "../../../shared-kernel/infrastructure/security/JwtTokenService";
import { AnonymizeUserOrders } from "../../application/use-cases/AnonymizeUserOrders";
import { GetOrderHistory } from "../../application/use-cases/GetOrderHistory";
import { TypeOrmOrderQueryRepository } from "../persistence/typeorm-order-query.repository";
import { TypeOrmOrderRepository } from "../persistence/typeorm-order.repository";
import { OrdersController } from "./orders.controller";
import { buildOrdersRoutes } from "./orders.routes";

export function buildOrdersModule(dataSource: DataSource): Router {
  const orderQueryRepository = new TypeOrmOrderQueryRepository(dataSource);
  const orderRepository = new TypeOrmOrderRepository(dataSource);
  const getOrderHistory = new GetOrderHistory(orderQueryRepository);
  const controller = new OrdersController(getOrderHistory);

  const anonymizeUserOrders = new AnonymizeUserOrders(orderRepository);
  domainEventBus.subscribe(UserAccountDeleted.eventName, async (event) => {
    await anonymizeUserOrders.execute({ userId: (event as UserAccountDeleted).userId });
  });

  const tokenService = new JwtTokenService(requireJwtSecret());
  const authenticate = buildAuthenticate(tokenService);

  return buildOrdersRoutes(controller, authenticate);
}

function requireJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET no está configurado.");
  }
  return secret;
}
