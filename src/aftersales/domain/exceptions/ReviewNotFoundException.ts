import { DomainException } from "../../../shared-kernel/domain/exceptions/DomainException";

/** [0064]: la reseña que el panel quiere moderar ya no existe. */
export class ReviewNotFoundException extends DomainException {
  readonly code = "REVIEW_NOT_FOUND";
  readonly statusCode = 404;

  constructor() {
    super("La reseña no existe.");
  }
}
