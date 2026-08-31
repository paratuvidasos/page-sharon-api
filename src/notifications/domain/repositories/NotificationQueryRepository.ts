import { NotificationType } from "../enums/NotificationType";

export interface NotificationListItem {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  linkUrl: string;
  orderNumber: string | null;
  readAt: Date | null;
  createdAt: Date;
}

export interface NotificationPage {
  items: NotificationListItem[];
  total: number;
}

/**
 * [0044]: read model del buzón — DTOs planos, sin hidratar la entidad (ver
 * sección "Queries" del CLAUDE.md del repo).
 */
export interface NotificationQueryRepository {
  listForUser(
    userId: string,
    pagination: { page: number; limit: number },
    filter?: { unreadOnly?: boolean },
  ): Promise<NotificationPage>;

  countUnread(userId: string): Promise<number>;
}
