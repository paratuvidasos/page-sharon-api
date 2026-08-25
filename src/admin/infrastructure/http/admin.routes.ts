import { RequestHandler, Router } from "express";
import { asyncHandler } from "../../../shared-kernel/infrastructure/http/async-handler";
import "./schemas/set-featured.schema";
import "./schemas/create-coupon.schema";
import "./schemas/shipping-zone.schema";
import "./schemas/order-fulfillment.schema";
import { AdminController } from "./admin.controller";

export function buildAdminRoutes(
  controller: AdminController,
  authenticate: RequestHandler,
  requireAdmin: RequestHandler,
): Router {
  const router = Router();

  router.use(authenticate, requireAdmin);
  router.patch("/products/:id/featured", asyncHandler(controller.setProductFeaturedHandler));
  router.post("/coupons", asyncHandler(controller.createCouponHandler));

  // [0049]: configuración de zonas de cobertura y restricciones de envío.
  router.get("/shipping/zones", asyncHandler(controller.listShippingZonesHandler));
  router.post("/shipping/zones", asyncHandler(controller.createShippingZoneHandler));
  router.patch("/shipping/zones/:id", asyncHandler(controller.updateShippingZoneHandler));
  router.delete("/shipping/zones/:id", asyncHandler(controller.deleteShippingZoneHandler));
  router.put("/shipping/zones/:id/restrictions", asyncHandler(controller.setZoneRestrictionsHandler));

  // [0047]: avanzar el pedido en su ciclo de cumplimiento (preparación, envío
  // con guía, entrega).
  router.patch("/orders/:orderNumber/status", asyncHandler(controller.updateOrderStatusHandler));

  return router;
}
