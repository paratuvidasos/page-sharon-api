import { MigrationInterface, QueryRunner } from "typeorm";

export class AddIsFeaturedToProducts1787327698927 implements MigrationInterface {
    name = 'AddIsFeaturedToProducts1787327698927'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "products" ADD "is_featured" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`CREATE INDEX "ix_products_is_featured" ON "products" ("is_featured") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."ix_products_is_featured"`);
        await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "is_featured"`);
    }

}
