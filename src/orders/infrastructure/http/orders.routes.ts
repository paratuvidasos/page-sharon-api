import { RequestHandler, Router } from "express";
import { asyncHandler } from "../../../shared-kernel/infrastructure/http/async-handler";
import "./schemas/order-history.schema";
import { OrdersController } from "./orders.controller";

export function buildOrdersRoutes(controller: OrdersController, authenticate: RequestHandler): Router {
  const router = Router();

  router.use(authenticate);

  router.get("/", asyncHandler(controller.listHistory));

  return router;
}
