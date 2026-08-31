import { Column, CreateDateColumn, Entity, Index, PrimaryColumn } from "typeorm";
import { StockReservationStatus } from "../../../domain/enums/StockReservationStatus";

/**
 * Unidades apartadas para un pedido mientras se resuelve su pago.
 *
 * `reference_id` es el id del pedido, no una FK: `orders` es dueño de sus
 * tablas y `catalog` no cruza esquemas con él (regla 4 del CLAUDE.md).
 */
@Entity({ name: "stock_reservations" })
@Index("ix_stock_reservations_reference_id", ["referenceId"])
@Index("ix_stock_reservations_status_expires_at", ["status", "expiresAt"])
export class StockReservationOrmEntity {
  @PrimaryColumn("uuid", { default: () => "uuidv7()" })
  id!: string;

  @Column({ name: "reference_id", type: "uuid" })
  referenceId!: string;

  @Column({ name: "product_id", type: "uuid" })
  productId!: string;

  @Column({ name: "variant_id", type: "uuid" })
  variantId!: string;

  @Column({ type: "integer" })
  quantity!: number;

  @Column({ type: "enum", enum: StockReservationStatus, default: StockReservationStatus.HELD })
  status!: StockReservationStatus;

  @Column({ name: "expires_at", type: "timestamptz" })
  expiresAt!: Date;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  @Column({ name: "resolved_at", type: "timestamptz", nullable: true })
  resolvedAt!: Date | null;
}
