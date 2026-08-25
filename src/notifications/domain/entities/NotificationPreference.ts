import { NotificationChannel } from "../enums/NotificationChannel";

export interface NotificationPreferenceProps {
  userId: string;
  emailEnabled: boolean;
  inAppEnabled: boolean;
}

/**
 * [0044]: por qué canal quiere enterarse cada persona.
 *
 * Los dos canales arrancan encendidos: quien compró espera que le avisen, y un
 * usuario que nunca entró a configurar nada no debería quedarse sin saber que
 * su pedido salió. Apagar los dos está permitido — es una decisión suya, no un
 * estado inválido.
 */
export class NotificationPreference {
  private constructor(private props: NotificationPreferenceProps) {}

  static defaultsFor(userId: string): NotificationPreference {
    return new NotificationPreference({ userId, emailEnabled: true, inAppEnabled: true });
  }

  static reconstitute(props: NotificationPreferenceProps): NotificationPreference {
    return new NotificationPreference(props);
  }

  update(input: { emailEnabled?: boolean; inAppEnabled?: boolean }): void {
    if (input.emailEnabled !== undefined) {
      this.props.emailEnabled = input.emailEnabled;
    }
    if (input.inAppEnabled !== undefined) {
      this.props.inAppEnabled = input.inAppEnabled;
    }
  }

  allows(channel: NotificationChannel): boolean {
    return channel === NotificationChannel.EMAIL ? this.props.emailEnabled : this.props.inAppEnabled;
  }

  toProps(): NotificationPreferenceProps {
    return { ...this.props };
  }
}
