import { ReviewStatus } from "../enums/ReviewStatus";
import { InvalidReviewRatingException } from "../exceptions/InvalidReviewRatingException";
import { InvalidReviewStatusTransitionException } from "../exceptions/InvalidReviewStatusTransitionException";
import { ReviewCommentRequiredException } from "../exceptions/ReviewCommentRequiredException";

export interface ReviewProps {
  id: string;
  productId: string;
  userId: string;
  rating: number;
  comment: string;
  status: ReviewStatus;
  rejectionReason: string | null;
  createdAt: Date;
}

export interface CreateReviewInput {
  id: string;
  productId: string;
  userId: string;
  rating: number;
  comment: string;
  /** [0064]: la decide el caso de uso según el flag `REVIEWS_REQUIRE_MODERATION`, no la entidad. */
  initialStatus: ReviewStatus;
}

export class Review {
  private constructor(private props: ReviewProps) {}

  static create(input: CreateReviewInput): Review {
    if (!Number.isInteger(input.rating) || input.rating < 1 || input.rating > 5) {
      throw new InvalidReviewRatingException();
    }
    const comment = input.comment.trim();
    if (comment.length === 0) {
      throw new ReviewCommentRequiredException();
    }

    return new Review({
      id: input.id,
      productId: input.productId,
      userId: input.userId,
      rating: input.rating,
      comment,
      status: input.initialStatus,
      rejectionReason: null,
      createdAt: new Date(),
    });
  }

  static reconstitute(props: ReviewProps): Review {
    return new Review(props);
  }

  get id(): string {
    return this.props.id;
  }

  get userId(): string {
    return this.props.userId;
  }

  get productId(): string {
    return this.props.productId;
  }

  get status(): ReviewStatus {
    return this.props.status;
  }

  /** [0064]: aprobar o rechazar solo tiene sentido mientras la reseña está pendiente de moderación. */
  approve(): void {
    if (this.props.status !== ReviewStatus.PENDING) {
      throw new InvalidReviewStatusTransitionException(this.props.status, ReviewStatus.APPROVED);
    }
    this.props.status = ReviewStatus.APPROVED;
    this.props.rejectionReason = null;
  }

  reject(reason: string): void {
    if (this.props.status !== ReviewStatus.PENDING) {
      throw new InvalidReviewStatusTransitionException(this.props.status, ReviewStatus.REJECTED);
    }
    this.props.status = ReviewStatus.REJECTED;
    this.props.rejectionReason = reason;
  }

  /** Solo válido desde APPROVED: ocultar es lo que se le hace a una reseña "ya publicada" (AC). */
  hide(): void {
    if (this.props.status !== ReviewStatus.APPROVED) {
      throw new InvalidReviewStatusTransitionException(this.props.status, ReviewStatus.HIDDEN);
    }
    this.props.status = ReviewStatus.HIDDEN;
  }

  toProps(): ReviewProps {
    return { ...this.props };
  }
}
