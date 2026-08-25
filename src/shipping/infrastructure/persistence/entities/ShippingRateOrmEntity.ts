import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryColumn } from "typeorm";
import { Currency } from "../../../../shared-kernel/domain/enums/Currency";
import { ShippingMethod } from "../../../domain/enums/ShippingMethod";
import { ShippingZoneOrmEntity } from "./ShippingZoneOrmEntity";

/**
 * Tarifa de un método de envío dentro de una zona. La FK a `shipping_zones`
 * sí existe porque ambas tablas son de este mismo módulo — la regla 4 del
 * CLAUDE.md prohíbe joins cruzando módulos, no dentro de uno.
 */
@Entity({ name: "shipping_rates" })
@Index("ix_shipping_rates_zone_id_method", ["zoneId", "method"])
export class ShippingRateOrmEntity {
  @PrimaryColumn("uuid", { default: () => "uuidv7()" })
  id!: string;

  @Column({ name: "zone_id", type: "uuid" })
  zoneId!: string;

  @ManyToOne(() => ShippingZoneOrmEntity, { onDelete: "CASCADE" })
  @JoinColumn({ name: "zone_id" })
  zone!: ShippingZoneOrmEntity;

  @Column({ type: "enum", enum: ShippingMethod })
  method!: ShippingMethod;

  @Column({ type: "varchar", length: 100 })
  label!: string;

  @Column({ type: "decimal", precision: 10, scale: 2 })
  cost!: string;

  @Column({ type: "enum", enum: Currency, default: Currency.COP })
  currency!: Currency;

  @Column({ name: "estimated_min_days", type: "integer" })
  estimatedMinDays!: number;

  @Column({ name: "estimated_max_days", type: "integer" })
  estimatedMaxDays!: number;

  @Column({
    name: "free_shipping_threshold",
    type: "decimal",
    precision: 10,
    scale: 2,
    nullable: true,
  })
  freeShippingThreshold!: string | null;

  @Column({ name: "is_active", type: "boolean", default: true })
  isActive!: boolean;
}
