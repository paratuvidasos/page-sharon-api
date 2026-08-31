import { RequestHandler, Router } from "express";
import { asyncHandler } from "../../../shared-kernel/infrastructure/http/async-handler";
import "./schemas/checkout.schema";
import "./schemas/order-detail.schema";
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

  // Autenticación opcional: un invitado también tiene que poder ver y
  // reintentar su pedido, probando el correo con el que compró.
  router.get("/:orderNumber", optionalAuthenticate, asyncHandler(controller.getByNumber));
  router.post(
    "/:orderNumber/retry-payment",
    optionalAuthenticate,
    asyncHandler(controller.retryPayment),
  );

  return router;
}
