import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * [0047] + [0043]: guía de envío e historial de estados.
 *
 * Los valores IN_PREPARATION, SHIPPED y DELIVERED ya existen en
 * `orders_status_enum` desde la migración inicial, así que no hace falta
 * `ALTER TYPE`: lo que faltaba no era el estado sino la transición del dominio
 * que lleva hasta él.
 *
 * El historial se rellena para los pedidos que ya existían con una sola
 * entrada —su estado actual, fechada en `placed_at`— en vez de dejarlos con el
 * historial vacío: la pantalla de rastreo mostraría un pedido sin ninguna
 * fecha, que se lee como un error del sistema. La fecha no es la real de cada
 * transición (esa información no se guardó nunca), y por eso la entrada dice
 * explícitamente que es anterior al historial.
 */
export class AddShipmentTrackingToOrders1787675167443 implements MigrationInterface {
    name = 'AddShipmentTrackingToOrders1787675167443'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "orders" ADD COLUMN "carrier_code" character varying(40)`);
        await queryRunner.query(`ALTER TABLE "orders" ADD COLUMN "carrier_name" character varying(100)`);
        await queryRunner.query(`ALTER TABLE "orders" ADD COLUMN "tracking_number" character varying(60)`);
        await queryRunner.query(`ALTER TABLE "orders" ADD COLUMN "tracking_url" character varying(500)`);
        await queryRunner.query(`ALTER TABLE "orders" ADD COLUMN "shipped_at" TIMESTAMP WITH TIME ZONE`);
        await queryRunner.query(`ALTER TABLE "orders" ADD COLUMN "delivered_at" TIMESTAMP WITH TIME ZONE`);
        await queryRunner.query(`CREATE INDEX "ix_orders_tracking_number" ON "orders" ("tracking_number")`);

        await queryRunner.query(`CREATE TABLE "order_status_history" ("id" uuid NOT NULL DEFAULT uuidv7(), "order_id" uuid NOT NULL, "status" "public"."orders_status_enum" NOT NULL, "note" character varying(200), "changed_at" TIMESTAMP WITH TIME ZONE NOT NULL, CONSTRAINT "PK_order_status_history" PRIMARY KEY ("id"), CONSTRAINT "FK_order_status_history_order" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE)`);
        await queryRunner.query(`CREATE INDEX "ix_order_status_history_order_id_changed_at" ON "order_status_history" ("order_id", "changed_at")`);

        await queryRunner.query(`INSERT INTO "order_status_history" ("order_id", "status", "note", "changed_at") SELECT "id", "status", 'Estado anterior al historial', "placed_at" FROM "orders"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "order_status_history"`);
        await queryRunner.query(`DROP INDEX "public"."ix_orders_tracking_number"`);
        await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN "delivered_at"`);
        await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN "shipped_at"`);
        await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN "tracking_url"`);
        await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN "tracking_number"`);
        await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN "carrier_name"`);
        await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN "carrier_code"`);
    }

}
