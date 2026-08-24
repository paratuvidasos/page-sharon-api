import { CouponDiscountType } from "../enums/CouponDiscountType";
import { CouponExpiredException } from "../exceptions/CouponExpiredException";
import { CouponMinimumPurchaseNotMetException } from "../exceptions/CouponMinimumPurchaseNotMetException";
import { CouponUsageLimitReachedException } from "../exceptions/CouponUsageLimitReachedException";

export interface CouponProps {
  id: string;
  code: string;
  discountType: CouponDiscountType;
  discountValue: number;
  minPurchaseAmount: number | null;
  startsAt: Date | null;
  endsAt: Date | null;
  isActive: boolean;
  maxRedemptions: number | null;
  redemptionsCount: number;
  createdAt: Date;
}

export interface CreateCouponInput {
  id: string;
  code: string;
  discountType: CouponDiscountType;
  discountValue: number;
  minPurchaseAmount?: number | null;
  startsAt?: Date | null;
  endsAt?: Date | null;
  maxRedemptions?: number | null;
}

export class Coupon {
  private constructor(private props: CouponProps) {}

  static create(input: CreateCouponInput): Coupon {
    return new Coupon({
      id: input.id,
      code: input.code.toUpperCase(),
      discountType: input.discountType,
      discountValue: input.discountValue,
      minPurchaseAmount: input.minPurchaseAmount ?? null,
      startsAt: input.startsAt ?? null,
      endsAt: input.endsAt ?? null,
      isActive: true,
      maxRedemptions: input.maxRedemptions ?? null,
      redemptionsCount: 0,
      createdAt: new Date(),
    });
  }

  static reconstitute(props: CouponProps): Coupon {
    return new Coupon(props);
  }

  get code(): string {
    return this.props.code;
  }

  /** Lanza la excepción específica correspondiente si el cupón no aplica hoy para `subtotal`. */
  assertApplicable(subtotal: number, now: Date): void {
    if (
      !this.props.isActive ||
      (this.props.startsAt && now < this.props.startsAt) ||
      (this.props.endsAt && now > this.props.endsAt)
    ) {
      throw new CouponExpiredException();
    }
    if (this.props.maxRedemptions != null && this.props.redemptionsCount >= this.props.maxRedemptions) {
      throw new CouponUsageLimitReachedException();
    }
    if (this.props.minPurchaseAmount != null && subtotal < this.props.minPurchaseAmount) {
      throw new CouponMinimumPurchaseNotMetException(this.props.minPurchaseAmount);
    }
  }

  discountAmount(subtotal: number): number {
    const raw =
      this.props.discountType === CouponDiscountType.PERCENTAGE
        ? subtotal * (this.props.discountValue / 100)
        : this.props.discountValue;
    return Math.min(raw, subtotal);
  }

  toProps(): CouponProps {
    return { ...this.props };
  }
}
