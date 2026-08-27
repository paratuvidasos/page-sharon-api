import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * [0057]: "no se puede eliminar un producto con pedidos históricos
 * asociados; se puede archivar en su lugar" (AC de "Crear, editar y
 * eliminar productos").
 */
export class AddArchivedToProductStatus1787690000000 implements MigrationInterface {
    name = 'AddArchivedToProductStatus1787690000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TYPE "public"."products_status_enum" ADD VALUE IF NOT EXISTS 'ARCHIVED'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TYPE "public"."products_status_enum" RENAME TO "products_status_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."products_status_enum" AS ENUM('ACTIVE', 'INACTIVE')`);
        await queryRunner.query(`ALTER TABLE "products" ALTER COLUMN "status" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "products" ALTER COLUMN "status" TYPE "public"."products_status_enum" USING "status"::text::"public"."products_status_enum"`);
        await queryRunner.query(`ALTER TABLE "products" ALTER COLUMN "status" SET DEFAULT 'ACTIVE'`);
        await queryRunner.query(`DROP TYPE "public"."products_status_enum_old"`);
    }
}
