import { DomainException } from "../../../shared-kernel/domain/exceptions/DomainException";

export class CouponNotFoundException extends DomainException {
  readonly code = "COUPON_NOT_FOUND";
  readonly statusCode = 404;

  constructor() {
    super("El cupón ingresado no existe.");
  }
}
