import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * [0044]: buzón in-app y preferencias de canal.
 *
 * Ninguna de las dos tablas referencia `users`: son de otro módulo (regla 4
 * del CLAUDE.md del repo). `notification_preferences` usa `user_id` como PK y
 * solo tiene fila para quien alguna vez cambió algo — quien nunca configuró
 * nada recibe los valores por defecto (ambos canales encendidos) sin ocupar
 * espacio ni obligar a este módulo a escuchar el alta de cuentas.
 */
export class CreateNotificationTables1787675634338 implements MigrationInterface {
    name = 'CreateNotificationTables1787675634338'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."notifications_type_enum" AS ENUM('ORDER_STATUS_CHANGED')`);
        await queryRunner.query(`CREATE TABLE "notifications" ("id" uuid NOT NULL DEFAULT uuidv7(), "user_id" uuid NOT NULL, "type" "public"."notifications_type_enum" NOT NULL, "title" character varying(150) NOT NULL, "body" character varying(500) NOT NULL, "link_url" character varying(500) NOT NULL, "order_number" character varying(30), "read_at" TIMESTAMP WITH TIME ZONE, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL, CONSTRAINT "PK_notifications" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "ix_notifications_user_id_created_at" ON "notifications" ("user_id", "created_at")`);
        await queryRunner.query(`CREATE INDEX "ix_notifications_user_id_unread" ON "notifications" ("user_id") WHERE "read_at" IS NULL`);

        await queryRunner.query(`CREATE TABLE "notification_preferences" ("user_id" uuid NOT NULL, "email_enabled" boolean NOT NULL DEFAULT true, "in_app_enabled" boolean NOT NULL DEFAULT true, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_notification_preferences" PRIMARY KEY ("user_id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "notification_preferences"`);
        await queryRunner.query(`DROP TABLE "notifications"`);
        await queryRunner.query(`DROP TYPE "public"."notifications_type_enum"`);
    }

}
