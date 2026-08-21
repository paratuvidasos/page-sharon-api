import { WishlistItemRepository } from "../../domain/repositories/WishlistItemRepository";

export interface RemoveProductFromWishlistInput {
  userId: string;
  productId: string;
}

export class RemoveProductFromWishlist {
  constructor(private readonly wishlistItemRepository: WishlistItemRepository) {}

  async execute(input: RemoveProductFromWishlistInput): Promise<void> {
    await this.wishlistItemRepository.remove(input.userId, input.productId);
  }
}
