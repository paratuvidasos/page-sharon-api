import { RequestHandler, Router } from "express";
import { asyncHandler } from "../../../shared-kernel/infrastructure/http/async-handler";
import "./schemas/notifications.schema";
import { NotificationsController } from "./notifications.controller";

export function buildNotificationsRoutes(
  controller: NotificationsController,
  authenticate: RequestHandler,
): Router {
  const router = Router();

  // Todo el buzón es del usuario autenticado: no hay notificaciones de
  // invitado, a quien se le avisa solo por correo.
  router.use(authenticate);

  router.get("/", asyncHandler(controller.list));
  router.get("/unread-count", asyncHandler(controller.unreadCount));
  // Antes de "/:id/read" no hace falta orden especial: los literales no
  // colisionan con el parámetro porque están en segmentos distintos.
  router.get("/preferences", asyncHandler(controller.getPreferences));
  router.put("/preferences", asyncHandler(controller.updatePreferences));
  router.post("/read-all", asyncHandler(controller.markAllRead));
  router.patch("/:id/read", asyncHandler(controller.markRead));

  return router;
}
