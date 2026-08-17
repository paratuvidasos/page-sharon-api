import { RequestHandler, Router } from "express";
import { asyncHandler } from "../../../../shared-kernel/infrastructure/http/async-handler";
import { AddressesController } from "./addresses.controller";

export function buildAddressesRoutes(
  controller: AddressesController,
  authenticate: RequestHandler,
): Router {
  const router = Router();

  router.use(authenticate);

  router.post("/", asyncHandler(controller.create));
  router.get("/", asyncHandler(controller.list));
  router.patch("/:addressId", asyncHandler(controller.update));
  router.delete("/:addressId", asyncHandler(controller.remove));
  router.patch("/:addressId/default", asyncHandler(controller.setDefault));
  router.patch("/:addressId/archive", asyncHandler(controller.archive));
  router.patch("/:addressId/restore", asyncHandler(controller.restore));

  return router;
}
