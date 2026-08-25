import { EmailSender } from "../../../shared-kernel/domain/ports/EmailSender";
import { renderOrderStatusEmail } from "../../../shared-kernel/infrastructure/email/templates/order-status.template";
import { generateId } from "../../../shared-kernel/infrastructure/ids/generate-id";
import { Notification } from "../../domain/entities/Notification";
import { NotificationPreference } from "../../domain/entities/NotificationPreference";
import { NotificationChannel } from "../../domain/enums/NotificationChannel";
import { NotificationType } from "../../domain/enums/NotificationType";
import { NotificationPreferenceRepository } from "../../domain/repositories/NotificationPreferenceRepository";
import { NotificationRepository } from "../../domain/repositories/NotificationRepository";
import { messageForStatus } from "../order-status-messages";

export interface NotifyOrderStatusChangedInput {
  orderNumber: string;
  status: string;
  userId: string | null;
  recipientEmail: string | null;
  carrierName: string | null;
  trackingNumber: string | null;
  trackingUrl: string | null;
}

/**
 * [0044]: avisa por los canales que la persona eligió cuando su envío cambia
 * de estado.
 *
 * Lo dispara el evento `OrderStatusChanged` de `orders`; nunca una llamada
 * directa (regla 3 del CLAUDE.md del repo).
 *
 * Un pedido de invitado solo recibe correo: no tiene cuenta, y por lo tanto no
 * hay buzón donde dejarle un aviso in-app. Sus preferencias son las que vienen
 * por defecto, porque tampoco tiene dónde configurarlas.
 */
export class NotifyOrderStatusChanged {
  constructor(
    private readonly notificationRepository: NotificationRepository,
    private readonly preferenceRepository: NotificationPreferenceRepository,
    private readonly emailSender: EmailSender,
    private readonly frontendUrl: string,
  ) {}

  async execute(input: NotifyOrderStatusChangedInput): Promise<void> {
    const message = messageForStatus(input.status);
    if (!message) {
      return;
    }

    const preference = input.userId
      ? (await this.preferenceRepository.findByUserId(input.userId)) ??
        NotificationPreference.defaultsFor(input.userId)
      : NotificationPreference.defaultsFor("");

    const orderUrl = `${this.frontendUrl}/pedidos/${encodeURIComponent(input.orderNumber)}`;

    if (input.userId && preference.allows(NotificationChannel.IN_APP)) {
      await this.notificationRepository.save(
        Notification.create({
          id: generateId(),
          userId: input.userId,
          type: NotificationType.ORDER_STATUS_CHANGED,
          title: message.heading,
          body: message.message,
          linkUrl: orderUrl,
          orderNumber: input.orderNumber,
          createdAt: new Date(),
        }),
      );
    }

    if (input.recipientEmail && preference.allows(NotificationChannel.EMAIL)) {
      await this.sendEmail(input, message.heading, message.message, orderUrl);
    }
  }

  /**
   * El correo va en su propio try/catch: el pedido ya salió y el aviso in-app
   * ya quedó guardado. Que el proveedor de correo esté caído no puede hacer
   * que el manejador del evento falle y se pierda todo lo demás — mismo
   * criterio que `ConfirmOrderPayment`.
   */
  private async sendEmail(
    input: NotifyOrderStatusChangedInput,
    heading: string,
    message: string,
    orderUrl: string,
  ): Promise<void> {
    try {
      await this.emailSender.send({
        to: input.recipientEmail!,
        subject: `${heading} (${input.orderNumber})`,
        html: renderOrderStatusEmail({
          orderNumber: input.orderNumber,
          heading,
          message,
          carrierName: input.carrierName,
          trackingNumber: input.trackingNumber,
          trackingUrl: input.trackingUrl,
          orderUrl,
        }),
      });
    } catch (error) {
      console.error(
        `[notifications] No se pudo avisar por correo el cambio de estado del pedido ${input.orderNumber}:`,
        error,
      );
    }
  }
}
