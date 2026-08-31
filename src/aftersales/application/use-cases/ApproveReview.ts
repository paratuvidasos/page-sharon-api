import { ReviewNotFoundException } from "../../domain/exceptions/ReviewNotFoundException";
import { ReviewRepository } from "../../domain/repositories/ReviewRepository";

/** [0064]: aprueba una reseña pendiente de moderación. */
export class ApproveReview {
  constructor(private readonly reviewRepository: ReviewRepository) {}

  async execute(input: { reviewId: string }): Promise<void> {
    const review = await this.reviewRepository.findById(input.reviewId);
    if (!review) {
      throw new ReviewNotFoundException();
    }

    review.approve();
    await this.reviewRepository.save(review);
  }
}
