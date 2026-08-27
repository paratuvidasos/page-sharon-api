import { MigrationInterface, QueryRunner } from "typeorm";

/** [0061]: restricción de un cupón a un subconjunto de productos (null = todo el carrito). */
export class AddApplicableProductIdsToCoupons1787710000000 implements MigrationInterface {
    name = 'AddApplicableProductIdsToCoupons1787710000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "coupons" ADD "applicable_product_ids" uuid array`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "coupons" DROP COLUMN "applicable_product_ids"`);
    }
}
