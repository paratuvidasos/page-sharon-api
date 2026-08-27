import { MigrationInterface, QueryRunner } from "typeorm";

/** [0059]: alerta de stock bajo configurable por variante (null = umbral global). */
export class AddLowStockThresholdToVariants1787690000001 implements MigrationInterface {
    name = 'AddLowStockThresholdToVariants1787690000001'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "product_variants" ADD "low_stock_threshold" integer`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "product_variants" DROP COLUMN "low_stock_threshold"`);
    }
}
