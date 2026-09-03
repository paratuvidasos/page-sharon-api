import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCategoryActionTypePlacementsToBanners1788000000000 implements MigrationInterface {
    name = 'AddCategoryActionTypePlacementsToBanners1788000000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."banners_category_enum" AS ENUM('EVENTO', 'KIT', 'PROMOCION', 'LANZAMIENTO', 'COLECCION', 'GENERAL')`);
        await queryRunner.query(`CREATE TYPE "public"."banners_action_type_enum" AS ENUM('COMPRAR', 'INSCRIPCION', 'MAS_INFORMACION')`);
        await queryRunner.query(`CREATE TYPE "public"."banners_placements_enum" AS ENUM('WELCOME_MODAL', 'HOME_SECTION')`);

        await queryRunner.query(`ALTER TABLE "banners" ADD "category" "public"."banners_category_enum" NOT NULL DEFAULT 'GENERAL'`);
        await queryRunner.query(`ALTER TABLE "banners" ADD "action_type" "public"."banners_action_type_enum" NOT NULL DEFAULT 'MAS_INFORMACION'`);
        await queryRunner.query(`ALTER TABLE "banners" ADD "placements" "public"."banners_placements_enum"[] NOT NULL DEFAULT '{WELCOME_MODAL,HOME_SECTION}'`);

        // Los defaults de arriba solo existen para no romper filas ya creadas —
        // de acá en adelante el código siempre manda los 3 campos explícitamente
        // (son requeridos en CreateBannerInput), así que se sacan los defaults
        // para que un olvido en el código falle rápido en vez de guardar un
        // valor "genérico" silencioso.
        await queryRunner.query(`ALTER TABLE "banners" ALTER COLUMN "category" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "banners" ALTER COLUMN "action_type" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "banners" ALTER COLUMN "placements" DROP DEFAULT`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "banners" DROP COLUMN "placements"`);
        await queryRunner.query(`ALTER TABLE "banners" DROP COLUMN "action_type"`);
        await queryRunner.query(`ALTER TABLE "banners" DROP COLUMN "category"`);

        await queryRunner.query(`DROP TYPE "public"."banners_placements_enum"`);
        await queryRunner.query(`DROP TYPE "public"."banners_action_type_enum"`);
        await queryRunner.query(`DROP TYPE "public"."banners_category_enum"`);
    }

}
