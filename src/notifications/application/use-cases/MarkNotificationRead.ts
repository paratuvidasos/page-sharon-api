import { NotificationNotFoundException } from "../../domain/exceptions/NotificationNotFoundException";
import { NotificationRepository } from "../../domain/repositories/NotificationRepository";

export class MarkNotificationRead {
  constructor(private readonly notificationRepository: NotificationRepository) {}

  async execute(input: { notificationId: string; userId: string }): Promise<void> {
    const notification = await this.notificationRepository.findById(input.notificationId);

    // Una notificación ajena se responde igual que una inexistente: confirmar
    // que el id existe le diría a cualquiera cuántas notificaciones tiene otro.
    if (!notification || notification.userId !== input.userId) {
      throw new NotificationNotFoundException();
    }

    notification.markRead(new Date());
    await this.notificationRepository.save(notification);
  }
}
