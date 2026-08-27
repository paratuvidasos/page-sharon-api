import { DomainException } from "../../../shared-kernel/domain/exceptions/DomainException";
import { ReviewStatus } from "../enums/ReviewStatus";

/** [0064]: la reseña no puede pasar de su estado actual al que pide el panel. */
export class InvalidReviewStatusTransitionException extends DomainException {
  readonly code = "INVALID_REVIEW_STATUS_TRANSITION";
  readonly statusCode = 409;

  constructor(from: ReviewStatus, to: ReviewStatus) {
    super(`La reseña no puede pasar de ${from} a ${to}.`);
  }
}
