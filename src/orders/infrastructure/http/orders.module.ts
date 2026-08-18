import { Router } from "express";
import { DataSource } from "typeorm";
import { buildAuthenticate } from "../../../shared-kernel/infrastructure/http/authenticate.middleware";
import { JwtTokenService } from "../../../shared-kernel/infrastructure/security/JwtTokenService";
import { GetOrderHistory } from "../../application/use-cases/GetOrderHistory";
import { TypeOrmOrderQueryRepository } from "../persistence/typeorm-order-query.repository";
import { OrdersController } from "./orders.controller";
import { buildOrdersRoutes } from "./orders.routes";

export function buildOrdersModule(dataSource: DataSource): Router {
  const orderQueryRepository = new TypeOrmOrderQueryRepository(dataSource);
  const getOrderHistory = new GetOrderHistory(orderQueryRepository);
  const controller = new OrdersController(getOrderHistory);

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
