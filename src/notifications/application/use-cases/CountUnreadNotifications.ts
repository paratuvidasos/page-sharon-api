import { NotificationQueryRepository } from "../../domain/repositories/NotificationQueryRepository";

/**
 * [0044]: solo el contador, para la campana del encabezado. Existe separado de
 * `ListNotifications` porque esa pantalla se consulta al abrir el buzón,
 * mientras que el contador se refresca seguido y no necesita traer ninguna fila.
 */
export class CountUnreadNotifications {
  constructor(private readonly notificationQueryRepository: NotificationQueryRepository) {}

  async execute(input: { userId: string }): Promise<{ unreadCount: number }> {
    return { unreadCount: await this.notificationQueryRepository.countUnread(input.userId) };
  }
}
