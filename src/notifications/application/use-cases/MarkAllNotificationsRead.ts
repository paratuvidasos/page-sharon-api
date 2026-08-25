import { NotificationRepository } from "../../domain/repositories/NotificationRepository";

/** [0044]: "marcar todo como leído" del buzón. */
export class MarkAllNotificationsRead {
  constructor(private readonly notificationRepository: NotificationRepository) {}

  async execute(input: { userId: string }): Promise<void> {
    await this.notificationRepository.markAllReadForUser(input.userId, new Date());
  }
}
