import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryColumn } from "typeorm";
import { ShippingZoneOrmEntity } from "./ShippingZoneOrmEntity";

/**
 * [0049]: producto que no se puede enviar a una zona (ej. por regulaciones de
 * aduana).
 *
 * `product_id` es un uuid suelto, sin FK a `products`: esa tabla es de
 * `catalog` y ningún módulo cruza esquemas con otro (regla 4 del CLAUDE.md
 * del repo), igual que `orders` no referencia `users`. La FK a
 * `shipping_zones` sí existe porque ambas tablas son de este módulo.
 */
@Entity({ name: "shipping_zone_product_restrictions" })
@Index("ux_zone_product_restriction", ["zoneId", "productId"], { unique: true })
export class ShippingZoneProductRestrictionOrmEntity {
  @PrimaryColumn("uuid", { default: () => "uuidv7()" })
  id!: string;

  @Column({ name: "zone_id", type: "uuid" })
  zoneId!: string;

  @ManyToOne(() => ShippingZoneOrmEntity, { onDelete: "CASCADE" })
  @JoinColumn({ name: "zone_id" })
  zone!: ShippingZoneOrmEntity;

  @Column({ name: "product_id", type: "uuid" })
  @Index("ix_zone_product_restrictions_product_id")
  productId!: string;

  @Column({ type: "varchar", length: 200, nullable: true })
  reason!: string | null;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;
}
