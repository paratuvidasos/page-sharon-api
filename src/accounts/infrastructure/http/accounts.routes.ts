import { RequestHandler, Router } from "express";
import { asyncHandler } from "../../../shared-kernel/infrastructure/http/async-handler";
import { AccountsController } from "./accounts.controller";
import { AddressesController } from "./addresses/addresses.controller";
import { buildAddressesRoutes } from "./addresses/addresses.routes";
import { uploadAvatar } from "./profile/upload-avatar.middleware";

export function buildAccountsRoutes(
  controller: AccountsController,
  addressesController: AddressesController,
  authenticate: RequestHandler,
): Router {
  const router = Router();

  router.post("/register", asyncHandler(controller.register));
  router.get("/verify-email", asyncHandler(controller.verifyEmailByToken));
  router.post("/resend-verification-email", asyncHandler(controller.resendVerification));
  router.post("/login", asyncHandler(controller.login));
  router.post("/refresh-token", asyncHandler(controller.refreshToken));
  router.post("/logout", asyncHandler(controller.logout));
  router.post("/logout-all", authenticate, asyncHandler(controller.logoutAllSessions));
  router.post("/forgot-password", asyncHandler(controller.requestPasswordReset));
  router.post("/reset-password", asyncHandler(controller.resetPasswordWithToken));
  router.get("/me", authenticate, asyncHandler(controller.getProfile));
  router.patch("/me", authenticate, uploadAvatar, asyncHandler(controller.updateProfile));
  router.use("/me/addresses", buildAddressesRoutes(addressesController, authenticate));

  return router;
}
