import { PaginationMeta, buildPaginationMeta } from "../../../shared-kernel/infrastructure/http/pagination";
import { ReviewStatus } from "../../domain/enums/ReviewStatus";
import { ModerationReviewItem, ReviewQueryRepository } from "../../domain/repositories/ReviewQueryRepository";

export interface ListReviewsForModerationResult {
  items: ModerationReviewItem[];
  meta: PaginationMeta;
}

/** [0064]: cola de moderación del panel administrativo, filtrable por estado. */
export class ListReviewsForModeration {
  constructor(private readonly reviewQueryRepository: ReviewQueryRepository) {}

  async execute(input: { page: number; limit: number; status?: ReviewStatus }): Promise<ListReviewsForModerationResult> {
    const { items, total } = await this.reviewQueryRepository.listForModeration(
      { status: input.status },
      { page: input.page, limit: input.limit },
    );

    return { items, meta: buildPaginationMeta(input.page, input.limit, total) };
  }
}
