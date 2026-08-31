import { RequestHandler, Router } from "express";
import { asyncHandler } from "../../../shared-kernel/infrastructure/http/async-handler";
import "./schemas/currencies.schema";
import "./schemas/locales.schema";
import "./schemas/preferences.schema";
import { LocalizationController } from "./localization.controller";

export function buildLocalizationRoutes(
  controller: LocalizationController,
  optionalAuthenticate: RequestHandler,
): Router {
  const router = Router();

  router.get("/locales", asyncHandler(controller.listLocales));
  router.get("/currencies", asyncHandler(controller.listCurrencies));
  router.get("/preferences", optionalAuthenticate, asyncHandler(controller.getPreferences));
  router.put("/preferences", optionalAuthenticate, asyncHandler(controller.putPreferences));

  return router;
}
