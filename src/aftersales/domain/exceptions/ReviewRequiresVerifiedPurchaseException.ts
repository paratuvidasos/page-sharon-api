import { DomainException } from "../../../shared-kernel/domain/exceptions/DomainException";

export class ReviewRequiresVerifiedPurchaseException extends DomainException {
  readonly code = "REVIEW_REQUIRES_VERIFIED_PURCHASE";
  readonly statusCode = 403;

  constructor() {
    super("Solo puedes reseñar productos que hayas comprado.");
  }
}
