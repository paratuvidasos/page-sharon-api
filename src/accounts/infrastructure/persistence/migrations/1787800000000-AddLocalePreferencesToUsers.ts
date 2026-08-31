import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * [0070]: preferencia de idioma/moneda elegida manualmente por el usuario.
 * Nullable a propósito: null significa "nunca eligió", así la sugerencia
 * automática por geo-IP sabe que no debe pisar nada.
 */
export class AddLocalePreferencesToUsers1787800000000 implements MigrationInterface {
    name = 'AddLocalePreferencesToUsers1787800000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."users_preferred_locale_enum" AS ENUM('es', 'en')`);
        await queryRunner.query(`ALTER TABLE "users" ADD "preferred_locale" "public"."users_preferred_locale_enum"`);
        await queryRunner.query(`CREATE TYPE "public"."users_preferred_currency_enum" AS ENUM('COP', 'USD')`);
        await queryRunner.query(`ALTER TABLE "users" ADD "preferred_currency" "public"."users_preferred_currency_enum"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "preferred_currency"`);
        await queryRunner.query(`DROP TYPE "public"."users_preferred_currency_enum"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "preferred_locale"`);
        await queryRunner.query(`DROP TYPE "public"."users_preferred_locale_enum"`);
    }

}
