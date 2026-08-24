import { RequestHandler, Router } from "express";
import { asyncHandler } from "../../../shared-kernel/infrastructure/http/async-handler";
import "./schemas/get-cart.schema";
import "./schemas/add-cart-item.schema";
import "./schemas/update-cart-item.schema";
import "./schemas/remove-cart-item.schema";
import "./schemas/clear-cart.schema";
import "./schemas/apply-coupon.schema";
import "./schemas/remove-coupon.schema";
import "./schemas/merge-cart.schema";
import { CartController } from "./cart.controller";
import { ensureGuestCartId } from "./guest-cart-id.middleware";

export function buildCartRoutes(controller: CartController, optionalAuthenticate: RequestHandler): Router {
  const router = Router();

  // Todas las rutas atienden tanto a usuarios logueados como a invitados
  // (identidad de invitado vía cookie `guest_cart_id`, ver
  // guest-cart-id.middleware.ts) — /merge exige sesión dentro del handler.
  router.use(optionalAuthenticate, ensureGuestCartId);

  router.get("/", asyncHandler(controller.getCartHandler));
  router.post("/items", asyncHandler(controller.addItemHandler));
  router.patch("/items/:itemId", asyncHandler(controller.updateItemQuantityHandler));
  router.delete("/items/:itemId", asyncHandler(controller.removeItemHandler));
  router.delete("/", asyncHandler(controller.clearCartHandler));
  router.post("/coupon", asyncHandler(controller.applyCouponHandler));
  router.delete("/coupon", asyncHandler(controller.removeCouponHandler));
  router.post("/merge", asyncHandler(controller.mergeHandler));

  return router;
}
