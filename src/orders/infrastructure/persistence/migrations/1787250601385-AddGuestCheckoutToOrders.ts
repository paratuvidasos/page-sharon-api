import { MigrationInterface, QueryRunner } from "typeorm";

export class AddGuestCheckoutToOrders1787250601385 implements MigrationInterface {
    name = 'AddGuestCheckoutToOrders1787250601385'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "orders" ALTER COLUMN "user_id" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "orders" ADD "guest_email" character varying(255)`);
        await queryRunner.query(`ALTER TABLE "orders" ADD CONSTRAINT "ck_orders_owner_xor" CHECK (("user_id" IS NOT NULL AND "guest_email" IS NULL) OR ("user_id" IS NULL AND "guest_email" IS NOT NULL))`);
        await queryRunner.query(`CREATE INDEX "ix_orders_guest_email" ON "orders" ("guest_email") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."ix_orders_guest_email"`);
        await queryRunner.query(`ALTER TABLE "orders" DROP CONSTRAINT "ck_orders_owner_xor"`);
        await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN "guest_email"`);
        await queryRunner.query(`ALTER TABLE "orders" ALTER COLUMN "user_id" SET NOT NULL`);
    }

}
