import { generateId } from "../../../shared-kernel/infrastructure/ids/generate-id";
import { Locale } from "../../../shared-kernel/domain/enums/Locale";
import { ProductNotFoundException } from "../../domain/exceptions/ProductNotFoundException";
import { ProductRepository } from "../../domain/repositories/ProductRepository";

export interface SetProductTranslationsInput {
  productId: string;
  translations: Array<{ locale: Locale; name: string; description: string }>;
}

/**
 * [0069]: reemplaza el set completo de traducciones de un producto — el
 * panel siempre manda todas las que tiene en pantalla, igual que
 * `SetZoneProductRestrictions`. Quitar un idioma es simplemente no mandarlo.
 */
export class SetProductTranslations {
  constructor(private readonly productRepository: ProductRepository) {}

  async execute(input: SetProductTranslationsInput): Promise<void> {
    const product = await this.productRepository.findById(input.productId);
    if (!product) {
      throw new ProductNotFoundException();
    }

    const locales = new Set(input.translations.map((t) => t.locale));
    for (const existing of product.translations) {
      if (!locales.has(existing.locale)) {
        product.removeTranslation(existing.locale);
      }
    }

    for (const translation of input.translations) {
      product.setTranslation(
        translation.locale,
        { name: translation.name, description: translation.description },
        generateId(),
      );
    }

    await this.productRepository.save(product);
  }
}
