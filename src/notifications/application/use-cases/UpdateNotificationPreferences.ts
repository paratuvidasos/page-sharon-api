import { NotificationPreference } from "../../domain/entities/NotificationPreference";
import { NotificationPreferenceRepository } from "../../domain/repositories/NotificationPreferenceRepository";

export interface UpdateNotificationPreferencesInput {
  userId: string;
  emailEnabled?: boolean;
  inAppEnabled?: boolean;
}

/** [0044]: el usuario elige por qué canal recibir los avisos de su envío. */
export class UpdateNotificationPreferences {
  constructor(private readonly preferenceRepository: NotificationPreferenceRepository) {}

  async execute(
    input: UpdateNotificationPreferencesInput,
  ): Promise<{ emailEnabled: boolean; inAppEnabled: boolean }> {
    const preference =
      (await this.preferenceRepository.findByUserId(input.userId)) ??
      NotificationPreference.defaultsFor(input.userId);

    preference.update({ emailEnabled: input.emailEnabled, inAppEnabled: input.inAppEnabled });
    await this.preferenceRepository.save(preference);

    const { emailEnabled, inAppEnabled } = preference.toProps();
    return { emailEnabled, inAppEnabled };
  }
}
