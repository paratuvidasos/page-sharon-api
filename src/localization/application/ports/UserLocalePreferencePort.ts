import { Currency } from "../../../shared-kernel/domain/enums/Currency";
import { Locale } from "../../../shared-kernel/domain/enums/Locale";

export interface UserLocalePreference {
  locale: Locale | null;
  currency: Currency | null;
}

/**
 * [0070]: puerto que `accounts` expone para que `localization` lea la
 * preferencia guardada de un usuario sin importar su infraestructura
 * interna (regla 2 del CLAUDE.md del repo).
 */
export interface GetUserLocalePreferencePort {
  /** `null` si el usuario no existe — un lookup opcional no debería tumbar la respuesta. */
  execute(input: { userId: string }): Promise<UserLocalePreference | null>;
}

/** [0070]: puerto que `accounts` expone para persistir una elección manual. */
export interface UpdateUserLocalePreferencePort {
  execute(input: { userId: string; locale?: Locale; currency?: Currency }): Promise<void>;
}
