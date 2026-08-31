import { describe, expect, it } from "vitest";
import { ReviewStatus } from "../enums/ReviewStatus";
import { InvalidReviewRatingException } from "../exceptions/InvalidReviewRatingException";
import { InvalidReviewStatusTransitionException } from "../exceptions/InvalidReviewStatusTransitionException";
import { ReviewCommentRequiredException } from "../exceptions/ReviewCommentRequiredException";
import { CreateReviewInput, Review } from "./Review";

function createReview(overrides: Partial<CreateReviewInput> = {}): Review {
  return Review.create({
    id: "review-1",
    productId: "product-1",
    userId: "user-1",
    rating: 5,
    comment: "Excelente producto.",
    initialStatus: ReviewStatus.APPROVED,
    ...overrides,
  });
}

describe("Review.create", () => {
  it("rechaza un rating fuera de 1-5", () => {
    expect(() => createReview({ rating: 0 })).toThrow(InvalidReviewRatingException);
    expect(() => createReview({ rating: 6 })).toThrow(InvalidReviewRatingException);
  });

  it("rechaza un comentario vacío", () => {
    expect(() => createReview({ comment: "   " })).toThrow(ReviewCommentRequiredException);
  });

  it("nace con el status que decide el caso de uso (auto-publicar vs moderación)", () => {
    expect(createReview({ initialStatus: ReviewStatus.APPROVED }).status).toBe(ReviewStatus.APPROVED);
    expect(createReview({ initialStatus: ReviewStatus.PENDING }).status).toBe(ReviewStatus.PENDING);
  });
});

describe("Review — moderación ([0064])", () => {
  it("approve solo es válido desde PENDING", () => {
    const review = createReview({ initialStatus: ReviewStatus.PENDING });
    review.approve();
    expect(review.status).toBe(ReviewStatus.APPROVED);

    expect(() => review.approve()).toThrow(InvalidReviewStatusTransitionException);
  });

  it("reject solo es válido desde PENDING y guarda el motivo", () => {
    const review = createReview({ initialStatus: ReviewStatus.PENDING });
    review.reject("Contenido ofensivo.");

    expect(review.status).toBe(ReviewStatus.REJECTED);
    expect(review.toProps().rejectionReason).toBe("Contenido ofensivo.");
  });

  it("no permite rechazar una reseña ya aprobada", () => {
    const review = createReview({ initialStatus: ReviewStatus.APPROVED });
    expect(() => review.reject("motivo")).toThrow(InvalidReviewStatusTransitionException);
  });

  it("hide solo es válido desde APPROVED (ya publicada)", () => {
    const review = createReview({ initialStatus: ReviewStatus.APPROVED });
    review.hide();
    expect(review.status).toBe(ReviewStatus.HIDDEN);
  });

  it("no permite ocultar una reseña que todavía no está publicada", () => {
    const review = createReview({ initialStatus: ReviewStatus.PENDING });
    expect(() => review.hide()).toThrow(InvalidReviewStatusTransitionException);
  });
});
