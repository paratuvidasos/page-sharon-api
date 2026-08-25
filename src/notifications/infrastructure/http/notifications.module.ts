import { Router } from "express";
import { DataSource } from "typeorm";
import { OrderStatusChanged } from "../../../shared-kernel/domain/events/OrderStatusChanged";
import { EmailSender } from "../../../shared-kernel/domain/ports/EmailSender";
import { domainEventBus } from "../../../shared-kernel/infrastructure/events/InMemoryDomainEventBus";
import { buildAuthenticate } from "../../../shared-kernel/infrastructure/http/authenticate.middleware";
import { JwtTokenService } from "../../../shared-kernel/infrastructure/security/JwtTokenService";
import { CountUnreadNotifications } from "../../application/use-cases/CountUnreadNotifications";
import { GetNotificationPreferences } from "../../application/use-cases/GetNotificationPreferences";
import { ListNotifications } from "../../application/use-cases/ListNotifications";
import { MarkAllNotificationsRead } from "../../application/use-cases/MarkAllNotificationsRead";
import { MarkNotificationRead } from "../../application/use-cases/MarkNotificationRead";
import { NotifyOrderStatusChanged } from "../../application/use-cases/NotifyOrderStatusChanged";
import { UpdateNotificationPreferences } from "../../application/use-cases/UpdateNotificationPreferences";
import { TypeOrmNotificationPreferenceRepository } from "../persistence/typeorm-notification-preference.repository";
import { TypeOrmNotificationQueryRepository } from "../persistence/typeorm-notification-query.repository";
import { TypeOrmNotificationRepository } from "../persistence/typeorm-notification.repository";
import { NotificationsController } from "./notifications.controller";
import { buildNotificationsRoutes } from "./notifications.routes";

const DEFAULT_FRONTEND_URL = "http://localhost:5190";

/**
 * [0044]: avisos de cambio de estado del envío, por correo y/o in-app.
 *
 * Se suscribe a `OrderStatusChanged` acá, en su propio composition root, sin
 * que `orders` sepa que este módulo existe (reglas 2 y 3 del CLAUDE.md del
 * repo). Si mañana hay que avisar de otra cosa —una devolución aprobada, un
 * producto de vuelta en stock— se suscribe otro evento en este mismo lugar.
 */
export function buildNotificationsModule(dataSource: DataSource, emailSender: EmailSender): Router {
  const notificationRepository = new TypeOrmNotificationRepository(dataSource);
  const notificationQueryRepository = new TypeOrmNotificationQueryRepository(dataSource);
  const preferenceRepository = new TypeOrmNotificationPreferenceRepository(dataSource);

  const notifyOrderStatusChanged = new NotifyOrderStatusChanged(
    notificationRepository,
    preferenceRepository,
    emailSender,
    process.env.FRONTEND_URL ?? DEFAULT_FRONTEND_URL,
  );

  domainEventBus.subscribe(OrderStatusChanged.eventName, async (event) => {
    const changed = event as OrderStatusChanged;
    await notifyOrderStatusChanged.execute({
      orderNumber: changed.orderNumber,
      status: changed.status,
      userId: changed.userId,
      recipientEmail: changed.recipientEmail,
      carrierName: changed.carrierName,
      trackingNumber: changed.trackingNumber,
      trackingUrl: changed.trackingUrl,
    });
  });

  const controller = new NotificationsController(
    new ListNotifications(notificationQueryRepository),
    new CountUnreadNotifications(notificationQueryRepository),
    new MarkNotificationRead(notificationRepository),
    new MarkAllNotificationsRead(notificationRepository),
    new GetNotificationPreferences(preferenceRepository),
    new UpdateNotificationPreferences(preferenceRepository),
  );

  const authenticate = buildAuthenticate(new JwtTokenService(requireJwtSecret()));

  return buildNotificationsRoutes(controller, authenticate);
}

function requireJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET no está configurado.");
  }
  return secret;
}
