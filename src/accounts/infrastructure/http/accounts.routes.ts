import { Router } from "express";
import { asyncHandler } from "../../../shared-kernel/infrastructure/http/async-handler";
import { AccountsController } from "./accounts.controller";

export function buildAccountsRoutes(controller: AccountsController): Router {
  const router = Router();

  router.post("/register", asyncHandler(controller.register));
  router.get("/verify-email", asyncHandler(controller.verifyEmailByToken));

  return router;
}
