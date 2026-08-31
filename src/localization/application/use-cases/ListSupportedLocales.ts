import { DEFAULT_LOCALE, Locale } from "../../../shared-kernel/domain/enums/Locale";

export interface SupportedLocaleItem {
  code: Locale;
  isDefault: boolean;
}

export interface ListSupportedLocalesResult {
  locales: SupportedLocaleItem[];
  default: Locale;
}

/**
 * [0067]: idiomas que el selector del front debe ofrecer.
 */
export class ListSupportedLocales {
  constructor(private readonly supportedLocales: Locale[]) {}

  execute(): ListSupportedLocalesResult {
    return {
      locales: this.supportedLocales.map((code) => ({ code, isDefault: code === DEFAULT_LOCALE })),
      default: DEFAULT_LOCALE,
    };
  }
}
