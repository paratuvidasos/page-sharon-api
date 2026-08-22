import { PaginationMeta, buildPaginationMeta } from "../../../shared-kernel/infrastructure/http/pagination";
import { ReviewSort } from "../../domain/enums/ReviewSort";
import {
  RatingSummary,
  ReviewListItem,
  ReviewQueryRepository,
} from "../../domain/repositories/ReviewQueryRepository";

export interface GetProductReviewsInput {
  productId: string;
  sort: ReviewSort;
  page: number;
  limit: number;
}

export interface GetProductReviewsResult {
  items: ReviewListItem[];
  meta: PaginationMeta;
  ratingSummary: RatingSummary;
}

export class GetProductReviews {
  constructor(private readonly reviewQueryRepository: ReviewQueryRepository) {}

  async execute(input: GetProductReviewsInput): Promise<GetProductReviewsResult> {
    const [{ items, total }, ratingSummary] = await Promise.all([
      this.reviewQueryRepository.listForProduct(input.productId, input.sort, {
        page: input.page,
        limit: input.limit,
      }),
      this.reviewQueryRepository.getRatingSummaryForProduct(input.productId),
    ]);

    return {
      items,
      meta: buildPaginationMeta(input.page, input.limit, total),
      ratingSummary,
    };
  }
}
