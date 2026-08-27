import { DomainException } from "../../../shared-kernel/domain/exceptions/DomainException";

/** [0066]: el banner que manda el panel administrativo no cumple sus invariantes. */
export class InvalidBannerException extends DomainException {
  readonly code = "INVALID_BANNER";
  readonly statusCode = 400;

  constructor(message: string) {
    super(message);
  }
}
