import { DomainException } from "../../../shared-kernel/domain/exceptions/DomainException";

/** [0057]: el producto (o una de sus variantes) que manda el panel administrativo no cumple sus invariantes. */
export class InvalidProductException extends DomainException {
  readonly code = "INVALID_PRODUCT";
  readonly statusCode = 400;

  constructor(message: string) {
    super(message);
  }
}
