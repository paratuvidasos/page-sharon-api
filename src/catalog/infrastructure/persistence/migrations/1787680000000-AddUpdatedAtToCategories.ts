import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * [0058]: hasta ahora `categories` solo se sembraba por migración y nunca se
 * actualizaba, así que no tenía `updated_at`. Con el CRUD del panel
 * administrativo la fila sí cambia.
 */
export class AddUpdatedAtToCategories1787680000000 implements MigrationInterface {
    name = 'AddUpdatedAtToCategories1787680000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "categories" ADD "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now()`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "categories" DROP COLUMN "updated_at"`);
    }
}
