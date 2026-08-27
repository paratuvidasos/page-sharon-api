import { ProductNotFoundException } from "../../domain/exceptions/ProductNotFoundException";
import { ProductRepository } from "../../domain/repositories/ProductRepository";

/** [0057]: quita una variante de un producto (no se puede quitar la última). */
export class RemoveProductVariant {
  constructor(private readonly productRepository: ProductRepository) {}

  async execute(input: { productId: string; variantId: string }): Promise<void> {
    const product = await this.productRepository.findById(input.productId);
    if (!product) {
      throw new ProductNotFoundException();
    }

    product.removeVariant(input.variantId);
    await this.productRepository.save(product);
  }
}
