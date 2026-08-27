import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * [0059]/[0060]: distingue una reserva devuelta porque el pedido pagado se
 * canceló/reembolsó (`REVERSED`) de una devuelta porque nunca se pagó
 * (`RELEASED`).
 */
export class AddReversedToStockReservationStatus1787690000002 implements MigrationInterface {
    name = 'AddReversedToStockReservationStatus1787690000002'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TYPE "public"."stock_reservations_status_enum" ADD VALUE IF NOT EXISTS 'REVERSED'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TYPE "public"."stock_reservations_status_enum" RENAME TO "stock_reservations_status_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."stock_reservations_status_enum" AS ENUM('HELD', 'COMMITTED', 'RELEASED')`);
        await queryRunner.query(`ALTER TABLE "stock_reservations" ALTER COLUMN "status" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "stock_reservations" ALTER COLUMN "status" TYPE "public"."stock_reservations_status_enum" USING "status"::text::"public"."stock_reservations_status_enum"`);
        await queryRunner.query(`ALTER TABLE "stock_reservations" ALTER COLUMN "status" SET DEFAULT 'HELD'`);
        await queryRunner.query(`DROP TYPE "public"."stock_reservations_status_enum_old"`);
    }
}
