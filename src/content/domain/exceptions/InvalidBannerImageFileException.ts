import { DomainException } from "../../../shared-kernel/domain/exceptions/DomainException";

export class InvalidBannerImageFileException extends DomainException {
  readonly code = "INVALID_BANNER_IMAGE_FILE";
  readonly statusCode = 400;

  constructor(message: string) {
    super(message);
  }
}
