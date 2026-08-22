import { generateId } from "../../../shared-kernel/infrastructure/ids/generate-id";
import { Review } from "../../domain/entities/Review";
import { DuplicateReviewException } from "../../domain/exceptions/DuplicateReviewException";
import { ReviewRequiresVerifiedPurchaseException } from "../../domain/exceptions/ReviewRequiresVerifiedPurchaseException";
import { ReviewRepository } from "../../domain/repositories/ReviewRepository";

export interface CreateReviewInput {
  productId: string;
  userId: string;
  rating: number;
  comment: string;
}

export interface CreateReviewResult {
  id: string;
  rating: number;
  comment: string;
  createdAt: Date;
}

export interface HasUserPurchasedProductPort {
  execute(input: { userId: string; productId: string }): Promise<boolean>;
}

/**
 * En vez de guardar reseñas no verificadas y filtrarlas al mostrarlas, la
 * compra verificada es una precondición para crear la reseña — así solo
 * existen reseñas verificadas y no hace falta un estado de moderación
 * aparte (ver "Decisiones de diseño clave" del plan de [0013]-[0022]).
 */
export class CreateReview {
  constructor(
    private readonly reviewRepository: ReviewRepository,
    private readonly hasUserPurchasedProduct: HasUserPurchasedProductPort,
  ) {}

  async execute(input: CreateReviewInput): Promise<CreateReviewResult> {
    const alreadyReviewed = await this.reviewRepository.existsForProductAndUser(
      input.productId,
      input.userId,
    );
    if (alreadyReviewed) {
      throw new DuplicateReviewException();
    }

    const purchased = await this.hasUserPurchasedProduct.execute({
      userId: input.userId,
      productId: input.productId,
    });
    if (!purchased) {
      throw new ReviewRequiresVerifiedPurchaseException();
    }

    const review = Review.create({
      id: generateId(),
      productId: input.productId,
      userId: input.userId,
      rating: input.rating,
      comment: input.comment,
    });
    await this.reviewRepository.save(review);

    const props = review.toProps();
    return { id: props.id, rating: props.rating, comment: props.comment, createdAt: props.createdAt };
  }
}
