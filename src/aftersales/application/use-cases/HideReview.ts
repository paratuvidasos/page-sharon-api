import { ReviewNotFoundException } from "../../domain/exceptions/ReviewNotFoundException";
import { ReviewRepository } from "../../domain/repositories/ReviewRepository";

/** [0064]: oculta una reseña ya publicada (APPROVED). */
export class HideReview {
  constructor(private readonly reviewRepository: ReviewRepository) {}

  async execute(input: { reviewId: string }): Promise<void> {
    const review = await this.reviewRepository.findById(input.reviewId);
    if (!review) {
      throw new ReviewNotFoundException();
    }

    review.hide();
    await this.reviewRepository.save(review);
  }
}
