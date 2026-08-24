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
}

/**
 * No hay ninguna US de administración de cupones en el backlog
 * [0023]-[0031] — este caso de uso mínimo existe solo para poder dar de
 * alta cupones de prueba desde el panel administrativo mientras no exista
 * esa US (ver módulo `admin`).
 */
export class CreateCoupon {
  constructor(private readonly couponRepository: CouponRepository) {}

  async execute(input: CreateCouponInput): Promise<void> {
    const coupon = Coupon.create({ id: generateId(), ...input });
    await this.couponRepository.save(coupon);
  }
}
