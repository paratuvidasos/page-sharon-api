import { Router } from "express";
import { asyncHandler } from "../../../shared-kernel/infrastructure/http/async-handler";
import "./schemas/shipping-quote.schema";
import { ShippingController } from "./shipping.controller";

export function buildShippingRoutes(controller: ShippingController): Router {
  const router = Router();

  // Sin autenticación: un invitado tiene que poder ver cuánto le cuesta el
  // envío antes de decidir si crea cuenta — y desde [0042], antes incluso de
  // llegar al carrito.
  router.post("/quote", asyncHandler(controller.quote));
  router.get("/coverage", asyncHandler(controller.coverage));

  return router;
}
