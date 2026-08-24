import { DomainException } from "../../../shared-kernel/domain/exceptions/DomainException";

export class CouponExpiredException extends DomainException {
  readonly code = "COUPON_EXPIRED";
  readonly statusCode = 400;

  constructor() {
    super("Este cupón ya no está vigente.");
  }
}
