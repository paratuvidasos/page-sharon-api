import { Router } from "express";
import { asyncHandler } from "../../../shared-kernel/infrastructure/http/async-handler";
import "./schemas/autocomplete.schema";
import "./schemas/categories.schema";
import "./schemas/featured-products.schema";
import "./schemas/filters.schema";
import "./schemas/list-products.schema";
import "./schemas/product-detail.schema";
import "./schemas/related-products.schema";
import "./schemas/search.schema";
import { CatalogController } from "./catalog.controller";

export function buildProductsRoutes(controller: CatalogController): Router {
  const router = Router();

  // "/filters", "/search*" y "/featured" deben registrarse antes de
  // "/:slug" para que Express no los interprete como un slug de producto.
  router.get("/filters", asyncHandler(controller.getProductFiltersHandler));
  router.get("/featured", asyncHandler(controller.listFeaturedProductsHandler));
  router.get("/search/suggestions", asyncHandler(controller.autocompleteProductsHandler));
  router.get("/search", asyncHandler(controller.searchProductsHandler));
  router.get("/", asyncHandler(controller.listProductsHandler));
  router.get("/:slug", asyncHandler(controller.getProductDetailHandler));
  router.get("/:slug/related", asyncHandler(controller.listRelatedProductsHandler));

  return router;
}

export function buildCategoriesRoutes(controller: CatalogController): Router {
  const router = Router();

  router.get("/", asyncHandler(controller.listCategoriesHandler));

  return router;
}
