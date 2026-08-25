import { Column, Entity, PrimaryColumn, UpdateDateColumn } from "typeorm";

/**
 * Una fila por usuario, y solo si alguna vez cambió algo: quien nunca entró a
 * configurar nada no tiene fila y recibe los valores por defecto. Por eso el
 * `user_id` es la PK y no hay id propio.
 */
@Entity({ name: "notification_preferences" })
export class NotificationPreferenceOrmEntity {
  @PrimaryColumn({ name: "user_id", type: "uuid" })
  userId!: string;

  @Column({ name: "email_enabled", type: "boolean", default: true })
  emailEnabled!: boolean;

  @Column({ name: "in_app_enabled", type: "boolean", default: true })
  inAppEnabled!: boolean;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt!: Date;
}
