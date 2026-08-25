import { Column, Entity, Index, PrimaryColumn } from "typeorm";
import { NotificationType } from "../../../domain/enums/NotificationType";

/**
 * Buzón in-app. Sin FK a `users`: esa tabla es de `accounts` y ningún módulo
 * cruza esquemas con otro (regla 4 del CLAUDE.md del repo), igual que
 * `orders`.
 */
@Entity({ name: "notifications" })
@Index("ix_notifications_user_id_created_at", ["userId", "createdAt"])
// Índice parcial para el contador de la campana, que es la consulta más
// frecuente del módulo y solo mira las no leídas.
@Index("ix_notifications_user_id_unread", ["userId"], { where: '"read_at" IS NULL' })
export class NotificationOrmEntity {
  @PrimaryColumn("uuid", { default: () => "uuidv7()" })
  id!: string;

  @Column({ name: "user_id", type: "uuid" })
  userId!: string;

  @Column({ type: "enum", enum: NotificationType })
  type!: NotificationType;

  @Column({ type: "varchar", length: 150 })
  title!: string;

  @Column({ type: "varchar", length: 500 })
  body!: string;

  @Column({ name: "link_url", type: "varchar", length: 500 })
  linkUrl!: string;

  @Column({ name: "order_number", type: "varchar", length: 30, nullable: true })
  orderNumber!: string | null;

  @Column({ name: "read_at", type: "timestamptz", nullable: true })
  readAt!: Date | null;

  @Column({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;
}
