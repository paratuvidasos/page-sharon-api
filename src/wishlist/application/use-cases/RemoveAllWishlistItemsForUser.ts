import { WishlistItemRepository } from "../../domain/repositories/WishlistItemRepository";

export interface RemoveAllWishlistItemsForUserInput {
  userId: string;
}

export class RemoveAllWishlistItemsForUser {
  constructor(private readonly wishlistItemRepository: WishlistItemRepository) {}

  async execute(input: RemoveAllWishlistItemsForUserInput): Promise<void> {
    await this.wishlistItemRepository.deleteAllForUser(input.userId);
  }
}
