import express, { Router } from "express";
import { asyncHandler } from "../../../shared-kernel/infrastructure/http/async-handler";
import "./schemas/payment-methods.schema";
import "./schemas/payment-status.schema";
import "./schemas/simulate-payment.schema";
import { PaymentsController } from "./payments.controller";

export function buildPaymentsRoutes(controller: PaymentsController): Router {
  const router = Router();

  router.get("/methods", asyncHandler(controller.listMethods));

  // `express.raw` en esta ruta y no en toda la app: la verificación de firma
  // necesita el body tal cual llegó. El `express.json()` global de index.ts
  // ya lo habría convertido en objeto, así que este router se monta antes.
  router.post(
    "/bold/webhook",
    express.raw({ type: "*/*", limit: "1mb" }),
    asyncHandler(controller.boldWebhook),
  );

  // Este router se monta antes del express.json() global (por el body crudo
  // del webhook), así que las rutas que sí reciben JSON traen su propio
  // parser. Va antes de "/:referenceId/status" para que "simulate" no se lea
  // como una referencia de pago.
  router.post("/simulate", express.json(), asyncHandler(controller.simulate));

  router.get("/:referenceId/status", asyncHandler(controller.status));

  return router;
}
