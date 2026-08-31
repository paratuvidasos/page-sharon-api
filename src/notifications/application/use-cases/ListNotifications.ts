import { buildPaginationMeta, PaginationMeta } from "../../../shared-kernel/infrastructure/http/pagination";
import {
  NotificationListItem,
  NotificationQueryRepository,
} from "../../domain/repositories/NotificationQueryRepository";

export interface ListNotificationsInput {
  userId: string;
  unreadOnly?: boolean;
  page: number;
  limit: number;
}

export interface ListNotificationsResult {
  items: NotificationListItem[];
  meta: PaginationMeta;
  unreadCount: number;
}

/**
 * [0044]: el buzón in-app. Devuelve además el total sin leer para que la
 * campana del encabezado no tenga que pedirlo aparte en cada render.
 */
export class ListNotifications {
  constructor(private readonly notificationQueryRepository: NotificationQueryRepository) {}

  async execute(input: ListNotificationsInput): Promise<ListNotificationsResult> {
    const [page, unreadCount] = await Promise.all([
      this.notificationQueryRepository.listForUser(
        input.userId,
        { page: input.page, limit: input.limit },
        { unreadOnly: input.unreadOnly },
      ),
      this.notificationQueryRepository.countUnread(input.userId),
    ]);

    return {
      items: page.items,
      meta: buildPaginationMeta(input.page, input.limit, page.total),
      unreadCount,
    };
  }
}
