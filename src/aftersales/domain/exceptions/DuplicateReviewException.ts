import { DomainException } from "../../../shared-kernel/domain/exceptions/DomainException";

export class DuplicateReviewException extends DomainException {
  readonly code = "DUPLICATE_REVIEW";
  readonly statusCode = 409;

  constructor() {
    super("Ya dejaste una reseña para este producto.");
  }
}
