import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Integración de tracking real con Track123 (ver el spec en
 * docs/superpowers/specs/2026-09-03-track123-shipment-tracking-design.md —
 * sin US de ClickUp asignada todavía).
 *
 * Sin FK a `orders`: `shipping` no cruza esquemas con otro módulo (regla 4
 * del CLAUDE.md del repo).
 */
export class CreateShipmentTracking1788441400000 implements MigrationInterface {
    name = 'CreateShipmentTracking1788441400000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."shipment_tracking_status_enum" AS ENUM('PENDING', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED', 'EXCEPTION', 'UNKNOWN')`);
        await queryRunner.query(`CREATE TABLE "shipment_tracking" ("id" uuid NOT NULL DEFAULT uuidv7(), "order_id" uuid NOT NULL, "carrier_code" character varying(100) NOT NULL, "tracking_number" character varying(100) NOT NULL, "status" "public"."shipment_tracking_status_enum" NOT NULL DEFAULT 'PENDING', "events" jsonb NOT NULL DEFAULT '[]', "last_synced_at" TIMESTAMP WITH TIME ZONE, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_shipment_tracking" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "ux_shipment_tracking_order_id" ON "shipment_tracking" ("order_id")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "shipment_tracking"`);
        await queryRunner.query(`DROP TYPE "public"."shipment_tracking_status_enum"`);
    }

}
