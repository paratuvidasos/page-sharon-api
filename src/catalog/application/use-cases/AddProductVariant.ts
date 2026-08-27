import { generateId } from "../../../shared-kernel/infrastructure/ids/generate-id";
import { CreateProductVariantInput } from "../../domain/entities/ProductVariant";
import { DuplicateSkuException } from "../../domain/exceptions/DuplicateSkuException";
import { ProductNotFoundException } from "../../domain/exceptions/ProductNotFoundException";
import { ProductRepository } from "../../domain/repositories/ProductRepository";
import { generateUniqueSku } from "./generateUniqueSku";

export interface AddProductVariantInput extends Omit<CreateProductVariantInput, "id" | "sku"> {
  productId: string;
  /** [0057]: opcional — si no viene, se genera un código único del lado del servidor. */
  sku?: string;
}

export interface AddProductVariantResult {
  id: string;
  sku: string;
}

/** [0057]: agrega una variante nueva a un producto existente. */
export class AddProductVariant {
  constructor(private readonly productRepository: ProductRepository) {}

  async execute(input: AddProductVariantInput): Promise<AddProductVariantResult> {
    const product = await this.productRepository.findById(input.productId);
    if (!product) {
      throw new ProductNotFoundException();
    }

    const sku = await this.resolveSku(input.sku);

    const variantId = generateId();
    const { productId: _productId, sku: _sku, ...variantInput } = input;
    product.addVariant({ id: variantId, sku, ...variantInput });
    await this.productRepository.save(product);
    return { id: variantId, sku };
  }

  private async resolveSku(sku: string | undefined): Promise<string> {
    if (!sku) {
      return generateUniqueSku(this.productRepository);
    }
    if (await this.productRepository.existsVariantWithSku(sku)) {
      throw new DuplicateSkuException(sku);
    }
    return sku;
  }
}
