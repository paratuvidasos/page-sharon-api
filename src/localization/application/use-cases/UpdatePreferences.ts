import { Currency } from "../../../shared-kernel/domain/enums/Currency";
import { Locale } from "../../../shared-kernel/domain/enums/Locale";
import { UpdateUserLocalePreferencePort } from "../ports/UserLocalePreferencePort";

export interface UpdatePreferencesInput {
  userId: string | null;
  locale?: Locale;
  currency?: Currency;
}

/**
 * [0070]: guarda una elección manual. La cookie la escribe el controller
 * (es un detalle HTTP); acá solo se persiste en la cuenta cuando hay sesión
 * — un invitado solo tiene la cookie, y eso ya alcanza para que la próxima
 * visita respete lo elegido.
 */
export class UpdatePreferences {
  constructor(private readonly updateUserLocalePreference: UpdateUserLocalePreferencePort) {}

  async execute(input: UpdatePreferencesInput): Promise<void> {
    if (!input.userId) return;

    await this.updateUserLocalePreference.execute({
      userId: input.userId,
      locale: input.locale,
      currency: input.currency,
    });
  }
}
