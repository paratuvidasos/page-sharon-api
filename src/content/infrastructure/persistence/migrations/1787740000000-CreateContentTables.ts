import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * [0066]: banners de home y configuración de destacados. La fila `default`
 * de `homepage_featured_config` se siembra en modo AUTOMATIC/BEST_SELLERS
 * para que la home no quede vacía al desplegar.
 */
export class CreateContentTables1787740000000 implements MigrationInterface {
    name = 'CreateContentTables1787740000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "banners" ("id" uuid NOT NULL DEFAULT uuidv7(), "image_url" character varying(500) NOT NULL, "link_url" character varying(500), "title" character varying(150) NOT NULL, "sort_order" integer NOT NULL DEFAULT 0, "starts_at" TIMESTAMPTZ, "ends_at" TIMESTAMPTZ, "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(), CONSTRAINT "PK_banners" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "ix_banners_sort_order" ON "banners" ("sort_order")`);

        await queryRunner.query(`CREATE TYPE "public"."homepage_featured_config_mode_enum" AS ENUM('MANUAL', 'AUTOMATIC')`);
        await queryRunner.query(`CREATE TYPE "public"."homepage_featured_config_automatic_rule_enum" AS ENUM('BEST_SELLERS', 'NEWEST')`);
        await queryRunner.query(`CREATE TABLE "homepage_featured_config" ("id" character varying(20) NOT NULL, "mode" "public"."homepage_featured_config_mode_enum" NOT NULL, "manual_product_ids" uuid array NOT NULL DEFAULT '{}', "automatic_rule" "public"."homepage_featured_config_automatic_rule_enum" NOT NULL, CONSTRAINT "PK_homepage_featured_config" PRIMARY KEY ("id"))`);

        await queryRunner.query(`INSERT INTO "homepage_featured_config" ("id", "mode", "manual_product_ids", "automatic_rule") VALUES ('default', 'AUTOMATIC', '{}', 'BEST_SELLERS')`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "homepage_featured_config"`);
        await queryRunner.query(`DROP TYPE "public"."homepage_featured_config_automatic_rule_enum"`);
        await queryRunner.query(`DROP TYPE "public"."homepage_featured_config_mode_enum"`);
        await queryRunner.query(`DROP INDEX "public"."ix_banners_sort_order"`);
        await queryRunner.query(`DROP TABLE "banners"`);
    }
}
