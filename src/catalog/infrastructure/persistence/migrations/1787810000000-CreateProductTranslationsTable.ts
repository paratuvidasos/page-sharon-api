import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * [0069]: nombre/descripción de producto por idioma, con fallback al español
 * base (que sigue viviendo en `products.name`/`products.description`, no se
 * duplica acá). El panel siempre reemplaza el set completo de una traducción
 * (ver `Product.setTranslation`), así que no hace falta más que una fila por
 * (producto, idioma).
 */
export class CreateProductTranslationsTable1787810000000 implements MigrationInterface {
    name = 'CreateProductTranslationsTable1787810000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."product_translations_locale_enum" AS ENUM('es', 'en')`);
        await queryRunner.query(`CREATE TABLE "product_translations" ("id" uuid NOT NULL DEFAULT uuidv7(), "product_id" uuid NOT NULL, "locale" "public"."product_translations_locale_enum" NOT NULL, "name" character varying(200) NOT NULL, "description" text NOT NULL, CONSTRAINT "PK_product_translations" PRIMARY KEY ("id"), CONSTRAINT "FK_product_translations_product" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE)`);
        await queryRunner.query(`CREATE UNIQUE INDEX "ux_product_translations_product_id_locale" ON "product_translations" ("product_id", "locale")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "product_translations"`);
        await queryRunner.query(`DROP TYPE "public"."product_translations_locale_enum"`);
    }

}
