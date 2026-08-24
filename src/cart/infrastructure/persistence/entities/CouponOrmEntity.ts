import { Column, CreateDateColumn, Entity, PrimaryColumn } from "typeorm";
import { CouponDiscountType } from "../../../domain/enums/CouponDiscountType";

@Entity({ name: "coupons" })
export class CouponOrmEntity {
  @PrimaryColumn("uuid", { default: () => "uuidv7()" })
  id!: string;

  @Column({ type: "varchar", length: 40, unique: true })
  code!: string;

  @Column({ name: "discount_type", type: "enum", enum: CouponDiscountType })
  discountType!: CouponDiscountType;

  @Column({ name: "discount_value", type: "numeric", precision: 10, scale: 2 })
  discountValue!: string;

  @Column({ name: "min_purchase_amount", type: "numeric", precision: 10, scale: 2, nullable: true })
  minPurchaseAmount!: string | null;

  @Column({ name: "starts_at", type: "timestamptz", nullable: true })
  startsAt!: Date | null;

  @Column({ name: "ends_at", type: "timestamptz", nullable: true })
  endsAt!: Date | null;

  @Column({ name: "is_active", type: "boolean", default: true })
  isActive!: boolean;

  @Column({ name: "max_redemptions", type: "int", nullable: true })
  maxRedemptions!: number | null;

  @Column({ name: "redemptions_count", type: "int", default: 0 })
  redemptionsCount!: number;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;
}
