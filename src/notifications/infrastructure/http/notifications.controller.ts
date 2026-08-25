import { Request, Response } from "express";
import { UnauthorizedException } from "../../../shared-kernel/domain/exceptions/UnauthorizedException";
import { CountUnreadNotifications } from "../../application/use-cases/CountUnreadNotifications";
import { GetNotificationPreferences } from "../../application/use-cases/GetNotificationPreferences";
import { ListNotifications } from "../../application/use-cases/ListNotifications";
import { MarkAllNotificationsRead } from "../../application/use-cases/MarkAllNotificationsRead";
import { MarkNotificationRead } from "../../application/use-cases/MarkNotificationRead";
import { UpdateNotificationPreferences } from "../../application/use-cases/UpdateNotificationPreferences";
import {
  NotificationListQuerySchema,
  NotificationParamsSchema,
  UpdateNotificationPreferencesRequestSchema,
} from "./schemas/notifications.schema";

export class NotificationsController {
  constructor(
    private readonly listNotifications: ListNotifications,
    private readonly countUnreadNotifications: CountUnreadNotifications,
    private readonly markNotificationRead: MarkNotificationRead,
    private readonly markAllNotificationsRead: MarkAllNotificationsRead,
    private readonly getNotificationPreferences: GetNotificationPreferences,
    private readonly updateNotificationPreferences: UpdateNotificationPreferences,
  ) {}

  private requireUserId(req: Request): string {
    if (!req.authUser) {
      throw new UnauthorizedException();
    }
    return req.authUser.sub;
  }

  list = async (req: Request, res: Response): Promise<void> => {
    const userId = this.requireUserId(req);
    const query = NotificationListQuerySchema.parse(req.query);
    const result = await this.listNotifications.execute({ userId, ...query });
    res.status(200).json(result);
  };

  unreadCount = async (req: Request, res: Response): Promise<void> => {
    const userId = this.requireUserId(req);
    res.status(200).json(await this.countUnreadNotifications.execute({ userId }));
  };

  markRead = async (req: Request, res: Response): Promise<void> => {
    const userId = this.requireUserId(req);
    const { id } = NotificationParamsSchema.parse(req.params);
    await this.markNotificationRead.execute({ notificationId: id, userId });
    res.status(204).send();
  };

  markAllRead = async (req: Request, res: Response): Promise<void> => {
    const userId = this.requireUserId(req);
    await this.markAllNotificationsRead.execute({ userId });
    res.status(204).send();
  };

  getPreferences = async (req: Request, res: Response): Promise<void> => {
    const userId = this.requireUserId(req);
    res.status(200).json(await this.getNotificationPreferences.execute({ userId }));
  };

  updatePreferences = async (req: Request, res: Response): Promise<void> => {
    const userId = this.requireUserId(req);
    const input = UpdateNotificationPreferencesRequestSchema.parse(req.body);
    res.status(200).json(await this.updateNotificationPreferences.execute({ userId, ...input }));
  };
}
