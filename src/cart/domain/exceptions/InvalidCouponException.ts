import { DomainException } from "../../../shared-kernel/domain/exceptions/DomainException";

/** [0061]: el cupón que manda el panel administrativo no cumple sus invariantes. */
export class InvalidCouponException extends DomainException {
  readonly code = "INVALID_COUPON";
  readonly statusCode = 400;

  constructor(message: string) {
    super(message);
  }
}
