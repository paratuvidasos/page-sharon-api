import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * [0038]: reservas de stock con vencimiento.
 *
 * Apartar el stock al confirmar el checkout (y no al aprobarse el pago) es lo
 * que evita la sobreventa durante la ventana en que el comprador está dentro
 * de la pasarela. El vencimiento es lo que evita el problema opuesto: que un
 * checkout abandonado congele unidades para siempre.
 */
export class CreateStockReservationsTable1787598753224 implements MigrationInterface {
    name = 'CreateStockReservationsTable1787598753224'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."stock_reservations_status_enum" AS ENUM('HELD', 'COMMITTED', 'RELEASED')`);
        await queryRunner.query(`CREATE TABLE "stock_reservations" ("id" uuid NOT NULL DEFAULT uuidv7(), "reference_id" uuid NOT NULL, "product_id" uuid NOT NULL, "variant_id" uuid NOT NULL, "quantity" integer NOT NULL, "status" "public"."stock_reservations_status_enum" NOT NULL DEFAULT 'HELD', "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "resolved_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_stock_reservations" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "ix_stock_reservations_reference_id" ON "stock_reservations" ("reference_id")`);
        await queryRunner.query(`CREATE INDEX "ix_stock_reservations_status_expires_at" ON "stock_reservations" ("status", "expires_at")`);
        await queryRunner.query(`ALTER TABLE "product_variants" ADD CONSTRAINT "ck_product_variants_stock_non_negative" CHECK ("stock_quantity" >= 0)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "product_variants" DROP CONSTRAINT "ck_product_variants_stock_non_negative"`);
        await queryRunner.query(`DROP TABLE "stock_reservations"`);
        await queryRunner.query(`DROP TYPE "public"."stock_reservations_status_enum"`);
    }

}
