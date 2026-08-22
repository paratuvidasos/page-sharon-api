import { RequestHandler, Router } from "express";
import { asyncHandler } from "../../../shared-kernel/infrastructure/http/async-handler";
import "./schemas/create-review.schema";
import "./schemas/list-reviews.schema";
import { ReviewsController } from "./reviews.controller";

/**
 * Se monta en `index.ts` bajo `/api/v1/products/:productId/reviews`
 * (mergeParams:true) — la URL vive bajo `/products` pero el código y la
 * tabla son de `aftersales`, igual que `/accounts/me/addresses` anida bajo
 * otro path del mismo módulo sin romper ownership.
 */
export function buildReviewsRoutes(controller: ReviewsController, authenticate: RequestHandler): Router {
  const router = Router({ mergeParams: true });

  router.get("/", asyncHandler(controller.list));
  router.post("/", authenticate, asyncHandler(controller.create));

  return router;
}
