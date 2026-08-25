import { NotificationPreference } from "../../domain/entities/NotificationPreference";
import { NotificationPreferenceRepository } from "../../domain/repositories/NotificationPreferenceRepository";

/**
 * [0044]: por qué canal quiere que le avisen. Quien nunca las configuró recibe
 * los valores por defecto (ambos canales encendidos) sin que se cree una fila:
 * leer no debería escribir.
 */
export class GetNotificationPreferences {
  constructor(private readonly preferenceRepository: NotificationPreferenceRepository) {}

  async execute(input: { userId: string }): Promise<{ emailEnabled: boolean; inAppEnabled: boolean }> {
    const preference =
      (await this.preferenceRepository.findByUserId(input.userId)) ??
      NotificationPreference.defaultsFor(input.userId);

    const { emailEnabled, inAppEnabled } = preference.toProps();
    return { emailEnabled, inAppEnabled };
  }
}
