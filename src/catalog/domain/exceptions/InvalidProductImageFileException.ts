import { DomainException } from "../../../shared-kernel/domain/exceptions/DomainException";

export class InvalidProductImageFileException extends DomainException {
  readonly code = "INVALID_PRODUCT_IMAGE_FILE";
  readonly statusCode = 400;

  constructor(message: string) {
    super(message);
  }
}
