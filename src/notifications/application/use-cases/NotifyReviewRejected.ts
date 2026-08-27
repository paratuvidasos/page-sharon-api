import { EmailSender } from "../../../shared-kernel/domain/ports/EmailSender";
import { renderReviewRejectedEmail } from "../../../shared-kernel/infrastructure/email/templates/review-rejected.template";
import { generateId } from "../../../shared-kernel/infrastructure/ids/generate-id";
import { Notification } from "../../domain/entities/Notification";
import { NotificationPreference } from "../../domain/entities/NotificationPreference";
import { NotificationChannel } from "../../domain/enums/NotificationChannel";
import { NotificationType } from "../../domain/enums/NotificationType";
import { NotificationPreferenceRepository } from "../../domain/repositories/NotificationPreferenceRepository";
import { NotificationRepository } from "../../domain/repositories/NotificationRepository";

export interface NotifyReviewRejectedInput {
  userId: string;
  recipientEmail: string;
  reason: string;
}

/**
 * [0064]: avisa al cliente cuando su reseña fue rechazada, con el motivo.
 * Lo dispara el evento `ReviewRejected` de `aftersales`; nunca una llamada
 * directa (regla 3 del CLAUDE.md del repo).
 */
export class NotifyReviewRejected {
  constructor(
    private readonly notificationRepository: NotificationRepository,
    private readonly preferenceRepository: NotificationPreferenceRepository,
    private readonly emailSender: EmailSender,
    private readonly frontendUrl: string,
  ) {}

  async execute(input: NotifyReviewRejectedInput): Promise<void> {
    const preference =
      (await this.preferenceRepository.findByUserId(input.userId)) ??
      NotificationPreference.defaultsFor(input.userId);

    if (preference.allows(NotificationChannel.IN_APP)) {
      await this.notificationRepository.save(
        Notification.create({
          id: generateId(),
          userId: input.userId,
          type: NotificationType.REVIEW_REJECTED,
          title: "Tu reseña no fue publicada",
          body: input.reason,
          linkUrl: this.frontendUrl,
          orderNumber: null,
          createdAt: new Date(),
        }),
      );
    }

    if (preference.allows(NotificationChannel.EMAIL)) {
      try {
        await this.emailSender.send({
          to: input.recipientEmail,
          subject: "Tu reseña no fue publicada",
          html: renderReviewRejectedEmail({ reason: input.reason, catalogUrl: this.frontendUrl }),
        });
      } catch (error) {
        console.error(`[notifications] No se pudo avisar por correo el rechazo de la reseña:`, error);
      }
    }
  }
}
