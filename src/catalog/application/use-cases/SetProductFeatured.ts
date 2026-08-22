import { ProductRepository } from "../../domain/repositories/ProductRepository";

export interface SetProductFeaturedInput {
  productId: string;
  isFeatured: boolean;
}

/**
 * Expuesto a `admin` ([0022]) como puerto — mismo patrón que
 * `registerUserForCheckout` expuesto por `accounts` a `orders`. `admin` no
 * tiene tabla propia para "destacado": la columna es de `catalog`, que la
 * sigue siendo dueña.
 */
export class SetProductFeatured {
  constructor(private readonly productRepository: ProductRepository) {}

  async execute(input: SetProductFeaturedInput): Promise<void> {
    await this.productRepository.setFeatured(input.productId, input.isFeatured);
  }
}
