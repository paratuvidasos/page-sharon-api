import { RequestHandler, Router } from "express";
import { asyncHandler } from "../../../shared-kernel/infrastructure/http/async-handler";
import { AccountsController } from "./accounts.controller";
import { uploadAvatar } from "./upload-avatar.middleware";

export function buildAccountsRoutes(
  controller: AccountsController,
  authenticate: RequestHandler,
): Router {
  const router = Router();

  router.post("/register", asyncHandler(controller.register));
  router.get("/verify-email", asyncHandler(controller.verifyEmailByToken));
  router.post("/resend-verification-email", asyncHandler(controller.resendVerification));
  router.post("/login", asyncHandler(controller.login));
  router.post("/refresh-token", asyncHandler(controller.refreshToken));
  router.post("/forgot-password", asyncHandler(controller.requestPasswordReset));
  router.post("/reset-password", asyncHandler(controller.resetPasswordWithToken));
  router.patch("/me", authenticate, uploadAvatar, asyncHandler(controller.updateProfile));

  return router;
}
