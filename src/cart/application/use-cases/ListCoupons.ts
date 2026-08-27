import { PaginationMeta, buildPaginationMeta } from "../../../shared-kernel/infrastructure/http/pagination";
import { CouponProps } from "../../domain/entities/Coupon";
import { CouponRepository } from "../../domain/repositories/CouponRepository";

export interface ListCouponsResult {
  items: CouponProps[];
  meta: PaginationMeta;
}

/** [0061]: listado de cupones para el panel administrativo, con su uso acumulado (`redemptionsCount`/`maxRedemptions`, ya en el agregado — sin tabla nueva). */
export class ListCoupons {
  constructor(private readonly couponRepository: CouponRepository) {}

  async execute(input: { page: number; limit: number }): Promise<ListCouponsResult> {
    const { items, total } = await this.couponRepository.findAll({ page: input.page, limit: input.limit });
    return {
      items: items.map((coupon) => coupon.toProps()),
      meta: buildPaginationMeta(input.page, input.limit, total),
    };
  }
}
