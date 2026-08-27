import { ProductRepository } from "../../domain/repositories/ProductRepository";

/** [0059]: umbral de stock bajo de una variante (`null` = usar el umbral global). */
export class SetVariantLowStockThreshold {
  constructor(private readonly productRepository: ProductRepository) {}

  async execute(input: { variantId: string; threshold: number | null }): Promise<void> {
    await this.productRepository.setVariantLowStockThreshold(input.variantId, input.threshold);
  }
}
