import { MigrationInterface, QueryRunner } from "typeorm";

export class AddSalesCountToProducts1787327185860 implements MigrationInterface {
    name = 'AddSalesCountToProducts1787327185860'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "products" ADD "sales_count" integer NOT NULL DEFAULT 0`);
        await queryRunner.query(`CREATE INDEX "ix_products_sales_count" ON "products" ("sales_count") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."ix_products_sales_count"`);
        await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "sales_count"`);
    }

}
