import { WishlistQueryRepository } from "../../domain/repositories/WishlistQueryRepository";

export interface CheckWishlistMembershipInput {
  userId: string;
  productIds: string[];
}

export class CheckWishlistMembership {
  constructor(private readonly wishlistQueryRepository: WishlistQueryRepository) {}

  async execute(input: CheckWishlistMembershipInput): Promise<string[]> {
    return this.wishlistQueryRepository.findWishlistedProductIds(input.userId, input.productIds);
  }
}
