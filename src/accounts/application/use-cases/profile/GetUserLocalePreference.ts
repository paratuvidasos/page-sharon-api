import { Currency } from "../../../../shared-kernel/domain/enums/Currency";
import { Locale } from "../../../../shared-kernel/domain/enums/Locale";
import { UserRepository } from "../../../domain/repositories/UserRepository";

export interface UserLocalePreferenceResult {
  locale: Locale | null;
  currency: Currency | null;
}

/**
 * [0070]: expone la preferencia guardada del usuario con la misma forma que
 * `GetUserLocalePreferencePort` de `localization` (regla 2 del CLAUDE.md del
 * repo: sin importar el tipo del otro módulo, el wiring en `index.ts` lo
 * conecta por forma estructural — igual que `ShippingQuotePort`).
 *
 * A diferencia de `GetCustomerContact`/`GetProfile`, un usuario no
 * encontrado no es un error acá — es un lookup opcional durante la
 * resolución de idioma/moneda, y esa resolución nunca debe fallar por eso.
 */
export class GetUserLocalePreference {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(input: { userId: string }): Promise<UserLocalePreferenceResult | null> {
    const user = await this.userRepository.findById(input.userId);
    if (!user) {
      return null;
    }

    return { locale: user.preferredLocale, currency: user.preferredCurrency };
  }
}
