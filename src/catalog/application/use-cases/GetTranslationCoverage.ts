import { DEFAULT_LOCALE, Locale } from "../../../shared-kernel/domain/enums/Locale";
import { ProductQueryRepository, TranslationCoverageItem } from "../../domain/repositories/ProductQueryRepository";

/**
 * [0069]: qué porcentaje del catálogo activo está traducido a cada idioma
 * soportado — CA 3 de la US. Siempre una fila por idioma en `locales`, aunque
 * esté en 0%.
 */
export class GetTranslationCoverage {
  constructor(
    private readonly productQueryRepository: ProductQueryRepository,
    private readonly supportedLocales: Locale[],
  ) {}

  async execute(): Promise<TranslationCoverageItem[]> {
    // El español base nunca tiene fila en `product_translations` — no tiene
    // sentido reportarlo como "0% traducido" cuando es el idioma de origen.
    const targetLocales = this.supportedLocales.filter((locale) => locale !== DEFAULT_LOCALE);
    return this.productQueryRepository.countTranslatedByLocale(targetLocales);
  }
}
