import { Column, CreateDateColumn, Entity, Index, PrimaryColumn } from "typeorm";
import { ShipmentTrackingStatus } from "../../../domain/enums/ShipmentTrackingStatus";

export interface ShipmentTrackingEventRow {
  status: ShipmentTrackingStatus;
  description: string;
  location: string | null;
  occurredAt: string;
}

/**
 * Historial paralelo al de `orders` ([0043]): lo que informa la
 * transportadora, no lo que decide el admin. Sin FK a `orders` — `shipping`
 * no cruza esquemas con otro módulo (regla 4 del CLAUDE.md del repo); un
 * `orderId` huérfano tras borrar un pedido no rompe nada, solo deja de
 * consultarse.
 */
@Entity({ name: "shipment_tracking" })
export class ShipmentTrackingOrmEntity {
  @PrimaryColumn("uuid", { default: () => "uuidv7()" })
  id!: string;

  @Column({ name: "order_id", type: "uuid" })
  @Index("ux_shipment_tracking_order_id", { unique: true })
  orderId!: string;

  @Column({ name: "carrier_code", type: "varchar", length: 100 })
  carrierCode!: string;

  @Column({ name: "tracking_number", type: "varchar", length: 100 })
  trackingNumber!: string;

  @Column({ type: "enum", enum: ShipmentTrackingStatus, default: ShipmentTrackingStatus.PENDING })
  status!: ShipmentTrackingStatus;

  @Column({ type: "jsonb", default: [] })
  events!: ShipmentTrackingEventRow[];

  @Column({ name: "last_synced_at", type: "timestamptz", nullable: true })
  lastSyncedAt!: Date | null;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;
}
