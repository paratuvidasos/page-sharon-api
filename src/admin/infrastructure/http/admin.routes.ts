import { RequestHandler, Router } from "express";
import { asyncHandler } from "../../../shared-kernel/infrastructure/http/async-handler";
import "./schemas/set-featured.schema";
import { AdminController } from "./admin.controller";

export function buildAdminRoutes(
  controller: AdminController,
  authenticate: RequestHandler,
  requireAdmin: RequestHandler,
): Router {
  const router = Router();

  router.use(authenticate, requireAdmin);
  router.patch("/products/:id/featured", asyncHandler(controller.setProductFeaturedHandler));

  return router;
}
