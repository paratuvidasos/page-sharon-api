import { DomainException } from "../../../shared-kernel/domain/exceptions/DomainException";

export class ReviewCommentRequiredException extends DomainException {
  readonly code = "REVIEW_COMMENT_REQUIRED";
  readonly statusCode = 400;

  constructor() {
    super("El comentario de la reseña no puede estar vacío.");
  }
}
