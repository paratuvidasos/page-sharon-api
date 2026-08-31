import { Currency } from "../../../../shared-kernel/domain/enums/Currency";
import { Locale } from "../../../../shared-kernel/domain/enums/Locale";
import { UserNotFoundException } from "../../../domain/exceptions/UserNotFoundException";
import { UserRepository } from "../../../domain/repositories/UserRepository";

export interface UpdateLocalePreferenceInput {
  userId: string;
  locale?: Locale;
  currency?: Currency;
}

/**
 * [0070]: persiste una elección manual de idioma/moneda. Expone la misma
 * forma que `UpdateUserLocalePreferencePort` de `localization` (ver
 * `GetUserLocalePreference` sobre por qué no se importa ese tipo acá).
 */
export class UpdateLocalePreference {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(input: UpdateLocalePreferenceInput): Promise<void> {
    const user = await this.userRepository.findById(input.userId);
    if (!user) {
      throw new UserNotFoundException();
    }

    user.updatePreferences({ locale: input.locale, currency: input.currency });
    await this.userRepository.save(user);
  }
}
