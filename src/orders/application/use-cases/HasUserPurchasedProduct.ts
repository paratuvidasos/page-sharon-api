import { OrderQueryRepository } from "../../domain/repositories/OrderQueryRepository";

export interface HasUserPurchasedProductInput {
  userId: string;
  productId: string;
}

/**
 * Puerto expuesto a `aftersales` ([0021]) para exigir compra verificada
 * antes de aceptar una reseña — mismo patrón que `registerUserForCheckout`/
 * `loginUser` expuestos por `accounts` a `orders`.
 */
export class HasUserPurchasedProduct {
  constructor(private readonly orderQueryRepository: OrderQueryRepository) {}

  async execute(input: HasUserPurchasedProductInput): Promise<boolean> {
    return this.orderQueryRepository.hasUserPurchasedProduct(input.userId, input.productId);
  }
}
