import { RequestHandler, Router } from "express";
import { asyncHandler } from "../../../shared-kernel/infrastructure/http/async-handler";
import "./schemas/set-featured.schema";
import "./schemas/create-coupon.schema";
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

  return router;
}
