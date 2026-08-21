import { RequestHandler, Router } from "express";
import { asyncHandler } from "../../../shared-kernel/infrastructure/http/async-handler";
import "./schemas/checkout.schema";
import "./schemas/order-history.schema";
import { OrdersController } from "./orders.controller";

export function buildOrdersRoutes(
  controller: OrdersController,
  authenticate: RequestHandler,
  optionalAuthenticate: RequestHandler,
): Router {
  const router = Router();

  router.post("/checkout", optionalAuthenticate, asyncHandler(controller.checkout));
  router.get("/", authenticate, asyncHandler(controller.listHistory));

  return router;
}
