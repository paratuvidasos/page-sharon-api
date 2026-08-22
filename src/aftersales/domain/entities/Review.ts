import { InvalidReviewRatingException } from "../exceptions/InvalidReviewRatingException";
import { ReviewCommentRequiredException } from "../exceptions/ReviewCommentRequiredException";

export interface ReviewProps {
  id: string;
  productId: string;
  userId: string;
  rating: number;
  comment: string;
  createdAt: Date;
}

export interface CreateReviewInput {
  id: string;
  productId: string;
  userId: string;
  rating: number;
  comment: string;
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
      createdAt: new Date(),
    });
  }

  static reconstitute(props: ReviewProps): Review {
    return new Review(props);
  }

  get id(): string {
    return this.props.id;
  }

  toProps(): ReviewProps {
    return { ...this.props };
  }
}
