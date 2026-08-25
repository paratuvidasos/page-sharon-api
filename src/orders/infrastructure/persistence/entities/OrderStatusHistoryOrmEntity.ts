import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryColumn } from "typeorm";
import { OrderStatus } from "../../../domain/enums/OrderStatus";
import { OrderOrmEntity } from "./OrderOrmEntity";

/**
 * [0043]: una fila por cada cambio de estado del pedido.
 *
 * Es append-only: nadie edita ni borra una entrada, porque el historial es
 * justamente el registro de lo que pasó. La FK a `orders` sí existe porque
 * ambas tablas son de este módulo (regla 4 del CLAUDE.md del repo).
 */
@Entity({ name: "order_status_history" })
@Index("ix_order_status_history_order_id_changed_at", ["orderId", "changedAt"])
export class OrderStatusHistoryOrmEntity {
  @PrimaryColumn("uuid", { default: () => "uuidv7()" })
  id!: string;

  @Column({ name: "order_id", type: "uuid" })
  orderId!: string;

  @ManyToOne(() => OrderOrmEntity, { onDelete: "CASCADE" })
  @JoinColumn({ name: "order_id" })
  order!: OrderOrmEntity;

  @Column({ type: "enum", enum: OrderStatus })
  status!: OrderStatus;

  /** Detalle libre del cambio: el número de guía, el motivo del rechazo, etc. */
  @Column({ type: "varchar", length: 200, nullable: true })
  note!: string | null;

  @Column({ name: "changed_at", type: "timestamptz" })
  changedAt!: Date;
}
