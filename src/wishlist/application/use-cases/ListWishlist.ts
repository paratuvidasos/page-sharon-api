import { PaginationMeta, buildPaginationMeta } from "../../../shared-kernel/infrastructure/http/pagination";
import { WishlistListItem, WishlistQueryRepository } from "../../domain/repositories/WishlistQueryRepository";

export interface ListWishlistInput {
  userId: string;
  page: number;
  limit: number;
}

export interface ListWishlistResult {
  items: WishlistListItem[];
  meta: PaginationMeta;
}

export class ListWishlist {
  constructor(private readonly wishlistQueryRepository: WishlistQueryRepository) {}

  async execute(input: ListWishlistInput): Promise<ListWishlistResult> {
    const { items, total } = await this.wishlistQueryRepository.listForUser(input.userId, {
      page: input.page,
      limit: input.limit,
    });

    return { items, meta: buildPaginationMeta(input.page, input.limit, total) };
  }
}
