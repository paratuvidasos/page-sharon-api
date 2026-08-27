import { CouponNotFoundException } from "../../domain/exceptions/CouponNotFoundException";
import { CouponRepository } from "../../domain/repositories/CouponRepository";

export interface UpdateCouponInput {
  code: string;
  discountValue?: number;
  minPurchaseAmount?: number | null;
  startsAt?: Date | null;
  endsAt?: Date | null;
  maxRedemptions?: number | null;
  applicableProductIds?: string[] | null;
  /** [0061]: activar/desactivar en el mismo endpoint — mismo patrón que `isActive` en zonas de envío. */
  isActive?: boolean;
}

/** [0061]: edición de un cupón (código y tipo de descuento son inmutables una vez creado). */
export class UpdateCoupon {
  constructor(private readonly couponRepository: CouponRepository) {}

  async execute(input: UpdateCouponInput): Promise<void> {
    const coupon = await this.couponRepository.findByCode(input.code);
    if (!coupon) {
      throw new CouponNotFoundException();
    }

    coupon.update({
      discountValue: input.discountValue,
      minPurchaseAmount: input.minPurchaseAmount,
      startsAt: input.startsAt,
      endsAt: input.endsAt,
      maxRedemptions: input.maxRedemptions,
      applicableProductIds: input.applicableProductIds,
    });

    if (input.isActive !== undefined) {
      if (input.isActive) {
        coupon.activate();
      } else {
        coupon.deactivate();
      }
    }

    await this.couponRepository.save(coupon);
  }
}
