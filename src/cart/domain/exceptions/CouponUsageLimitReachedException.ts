import { DomainException } from "../../../shared-kernel/domain/exceptions/DomainException";

export class CouponUsageLimitReachedException extends DomainException {
  readonly code = "COUPON_USAGE_LIMIT_REACHED";
  readonly statusCode = 400;

  constructor() {
    super("Este cupón alcanzó su límite de usos.");
  }
}
