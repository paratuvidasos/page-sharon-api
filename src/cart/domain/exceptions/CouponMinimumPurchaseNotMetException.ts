import { DomainException } from "../../../shared-kernel/domain/exceptions/DomainException";

export class CouponMinimumPurchaseNotMetException extends DomainException {
  readonly code = "COUPON_MINIMUM_PURCHASE_NOT_MET";
  readonly statusCode = 400;

  constructor(readonly minPurchaseAmount: number) {
    super(`Este cupón requiere una compra mínima de ${minPurchaseAmount}.`);
  }
}
