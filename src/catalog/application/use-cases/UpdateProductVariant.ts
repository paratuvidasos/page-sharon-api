import { UpdateProductVariantInput as DomainUpdateProductVariantInput } from "../../domain/entities/ProductVariant";
import { ProductNotFoundException } from "../../domain/exceptions/ProductNotFoundException";
import { ProductRepository } from "../../domain/repositories/ProductRepository";

export interface UpdateProductVariantInput extends DomainUpdateProductVariantInput {
  productId: string;
  variantId: string;
}

/** [0057]: edita una variante existente (sin tocar su stock, ver [0059] `AdjustVariantStock`). */
export class UpdateProductVariant {
  constructor(private readonly productRepository: ProductRepository) {}

  async execute(input: UpdateProductVariantInput): Promise<void> {
    const product = await this.productRepository.findById(input.productId);
    if (!product) {
      throw new ProductNotFoundException();
    }

    const { productId: _productId, variantId, ...variantInput } = input;
    product.updateVariant(variantId, variantInput);
    await this.productRepository.save(product);
  }
}
