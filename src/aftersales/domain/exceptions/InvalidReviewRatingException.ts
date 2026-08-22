import { DomainException } from "../../../shared-kernel/domain/exceptions/DomainException";

export class InvalidReviewRatingException extends DomainException {
  readonly code = "INVALID_REVIEW_RATING";
  readonly statusCode = 400;

  constructor() {
    super("La calificación debe ser un número entero entre 1 y 5.");
  }
}
