import { Coupon } from "../../domain/entities/Coupon";
import { CouponDiscountType } from "../../domain/enums/CouponDiscountType";
import { CouponRepository } from "../../domain/repositories/CouponRepository";
import { generateId } from "../../../shared-kernel/infrastructure/ids/generate-id";

export interface CreateCouponInput {
  code: string;
  discountType: CouponDiscountType;
  discountValue: number;
  minPurchaseAmount?: number | null;
  startsAt?: Date | null;
  endsAt?: Date | null;
  maxRedemptions?: number | null;
  applicableProductIds?: string[] | null;
}

/** [0061]: alta de un cupón desde el panel administrativo. */
export class CreateCoupon {
  constructor(private readonly couponRepository: CouponRepository) {}

  async execute(input: CreateCouponInput): Promise<void> {
    const coupon = Coupon.create({ id: generateId(), ...input });
    await this.couponRepository.save(coupon);
  }
}
