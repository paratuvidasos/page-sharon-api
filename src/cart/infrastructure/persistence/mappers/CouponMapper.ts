import { Coupon } from "../../../domain/entities/Coupon";
import { CouponOrmEntity } from "../entities/CouponOrmEntity";

export class CouponMapper {
  static toOrm(coupon: Coupon): CouponOrmEntity {
    const props = coupon.toProps();

    const orm = new CouponOrmEntity();
    orm.id = props.id;
    orm.code = props.code;
    orm.discountType = props.discountType;
    orm.discountValue = props.discountValue.toFixed(2);
    orm.minPurchaseAmount = props.minPurchaseAmount != null ? props.minPurchaseAmount.toFixed(2) : null;
    orm.startsAt = props.startsAt;
    orm.endsAt = props.endsAt;
    orm.isActive = props.isActive;
    orm.maxRedemptions = props.maxRedemptions;
    orm.redemptionsCount = props.redemptionsCount;
    return orm;
  }

  static toDomain(orm: CouponOrmEntity): Coupon {
    return Coupon.reconstitute({
      id: orm.id,
      code: orm.code,
      discountType: orm.discountType,
      discountValue: Number(orm.discountValue),
      minPurchaseAmount: orm.minPurchaseAmount != null ? Number(orm.minPurchaseAmount) : null,
      startsAt: orm.startsAt,
      endsAt: orm.endsAt,
      isActive: orm.isActive,
      maxRedemptions: orm.maxRedemptions,
      redemptionsCount: orm.redemptionsCount,
      createdAt: orm.createdAt,
    });
  }
}
