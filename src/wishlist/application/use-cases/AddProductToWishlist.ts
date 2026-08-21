import { generateId } from "../../../shared-kernel/infrastructure/ids/generate-id";
import { WishlistItem } from "../../domain/entities/WishlistItem";
import { WishlistItemRepository } from "../../domain/repositories/WishlistItemRepository";

export interface AddProductToWishlistInput {
  userId: string;
  productId: string;
}

export interface AddProductToWishlistResult {
  productId: string;
  addedAt: Date;
}

export class AddProductToWishlist {
  constructor(private readonly wishlistItemRepository: WishlistItemRepository) {}

  async execute(input: AddProductToWishlistInput): Promise<AddProductToWishlistResult> {
    const item = WishlistItem.create({
      id: generateId(),
      userId: input.userId,
      productId: input.productId,
    });

    const persisted = await this.wishlistItemRepository.add(item);

    const props = persisted.toProps();
    return { productId: props.productId, addedAt: props.addedAt };
  }
}
