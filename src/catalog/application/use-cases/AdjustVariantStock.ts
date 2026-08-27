import { ProductRepository } from "../../domain/repositories/ProductRepository";

/** [0059]: corrección manual de stock de una variante desde el panel administrativo. */
export class AdjustVariantStock {
  constructor(private readonly productRepository: ProductRepository) {}

  async execute(input: { variantId: string; quantity: number }): Promise<void> {
    await this.productRepository.setVariantStock(input.variantId, input.quantity);
  }
}
