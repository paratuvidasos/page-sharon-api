import { RequestHandler, Router } from "express";
import { asyncHandler } from "../../../shared-kernel/infrastructure/http/async-handler";
import "./schemas/add-to-wishlist.schema";
import "./schemas/list-wishlist.schema";
import "./schemas/remove-from-wishlist.schema";
import "./schemas/wishlist-membership.schema";
import { WishlistController } from "./wishlist.controller";

export function buildWishlistRoutes(controller: WishlistController, authenticate: RequestHandler): Router {
  const router = Router();

  router.use(authenticate);

  router.post("/items", asyncHandler(controller.add));
  router.delete("/items/:productId", asyncHandler(controller.remove));
  router.get("/", asyncHandler(controller.list));
  router.get("/membership", asyncHandler(controller.membership));

  return router;
}
