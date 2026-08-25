import { NotificationType } from "../enums/NotificationType";

export interface NotificationProps {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  /** Enlace al detalle de lo que motivó el aviso (criterio de [0044]). */
  linkUrl: string;
  /** Pedido al que se refiere, para poder agrupar por pedido en el buzón. */
  orderNumber: string | null;
  readAt: Date | null;
  createdAt: Date;
}

export interface CreateNotificationInput {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  linkUrl: string;
  orderNumber: string | null;
  createdAt: Date;
}

/**
 * [0044]: un aviso en el buzón in-app de una persona.
 *
 * Solo existe para usuarios con cuenta: un pedido de invitado se avisa por
 * correo y nada más, porque no hay buzón donde dejarlo. Por eso `userId` no es
 * opcional acá — quien no lo tenga, no genera esta entidad.
 */
export class Notification {
  private constructor(private props: NotificationProps) {}

  static create(input: CreateNotificationInput): Notification {
    return new Notification({ ...input, readAt: null });
  }

  static reconstitute(props: NotificationProps): Notification {
    return new Notification(props);
  }

  get id(): string {
    return this.props.id;
  }

  get userId(): string {
    return this.props.userId;
  }

  /** Marcar como leída dos veces no mueve la fecha: la primera lectura es la que cuenta. */
  markRead(readAt: Date): void {
    if (this.props.readAt) {
      return;
    }
    this.props.readAt = readAt;
  }

  toProps(): NotificationProps {
    return { ...this.props };
  }
}
