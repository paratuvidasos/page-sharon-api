import { Router } from "express";
import { asyncHandler } from "../../../shared-kernel/infrastructure/http/async-handler";
import "./schemas/public-content.schema";
import { ContentController } from "./content.controller";

/** [0066]: rutas públicas, montadas directo (no bajo /admin, sin auth). */
export function buildContentRoutes(controller: ContentController): Router {
  const router = Router();

  router.get("/banners", asyncHandler(controller.listBanners));
  router.get("/homepage/featured-products", asyncHandler(controller.listFeaturedProducts));

  return router;
}
