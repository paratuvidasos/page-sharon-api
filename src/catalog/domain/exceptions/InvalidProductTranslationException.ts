import { DomainException } from "../../../shared-kernel/domain/exceptions/DomainException";

export class InvalidProductTranslationException extends DomainException {
  readonly code = "INVALID_PRODUCT_TRANSLATION";
  readonly statusCode = 400;

  constructor(message: string) {
    super(message);
  }
}
