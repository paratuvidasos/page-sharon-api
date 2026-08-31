import { OrderQueryRepository } from "../../domain/repositories/OrderQueryRepository";

export interface HasProductBeenOrderedInput {
  productId: string;
}

/**
 * [0057]: puerto expuesto a `catalog` para que `DeleteProduct` decida entre
 * borrar de verdad o archivar — mismo patrón que `HasUserPurchasedProduct`
 * expuesto a `aftersales`.
 */
export class HasProductBeenOrdered {
  constructor(private readonly orderQueryRepository: OrderQueryRepository) {}

  async execute(input: HasProductBeenOrderedInput): Promise<boolean> {
    return this.orderQueryRepository.hasProductBeenOrdered(input.productId);
  }
}
