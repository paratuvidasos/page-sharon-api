import { Coupon } from "../entities/Coupon";

export interface CouponRepository {
  save(coupon: Coupon): Promise<void>;

  findByCode(code: string): Promise<Coupon | null>;
}
