import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateCatalogTables1787325170072 implements MigrationInterface {
    name = 'CreateCatalogTables1787325170072'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."products_status_enum" AS ENUM('ACTIVE', 'INACTIVE')`);
        await queryRunner.query(`CREATE TABLE "categories" ("id" uuid NOT NULL DEFAULT uuidv7(), "name" character varying(150) NOT NULL, "slug" character varying(160) NOT NULL, "parent_id" uuid, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_categories_slug" UNIQUE ("slug"), CONSTRAINT "PK_categories" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "categories" ADD CONSTRAINT "FK_categories_parent" FOREIGN KEY ("parent_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`CREATE TABLE "products" ("id" uuid NOT NULL DEFAULT uuidv7(), "category_id" uuid NOT NULL, "name" character varying(200) NOT NULL, "slug" character varying(220) NOT NULL, "description" text NOT NULL, "brand" character varying(120), "ingredients" text, "attributes" jsonb NOT NULL DEFAULT '{}', "base_price" numeric(10,2) NOT NULL, "compare_at_price" numeric(10,2), "status" "public"."products_status_enum" NOT NULL DEFAULT 'ACTIVE', "images" jsonb NOT NULL DEFAULT '[]', "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_products_slug" UNIQUE ("slug"), CONSTRAINT "PK_products" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "ix_products_category_id" ON "products" ("category_id") `);
        await queryRunner.query(`CREATE INDEX "ix_products_status" ON "products" ("status") `);
        await queryRunner.query(`ALTER TABLE "products" ADD CONSTRAINT "FK_products_category" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`CREATE TABLE "product_variants" ("id" uuid NOT NULL DEFAULT uuidv7(), "product_id" uuid NOT NULL, "sku" character varying(50) NOT NULL, "size" character varying(50), "scent" character varying(80), "color" character varying(50), "price_override" numeric(10,2), "stock_quantity" integer NOT NULL DEFAULT 0, "image_url" character varying(500), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_product_variants_sku" UNIQUE ("sku"), CONSTRAINT "PK_product_variants" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "ix_product_variants_product_id" ON "product_variants" ("product_id") `);
        await queryRunner.query(`ALTER TABLE "product_variants" ADD CONSTRAINT "FK_product_variants_product" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "product_variants" DROP CONSTRAINT "FK_product_variants_product"`);
        await queryRunner.query(`DROP INDEX "public"."ix_product_variants_product_id"`);
        await queryRunner.query(`DROP TABLE "product_variants"`);
        await queryRunner.query(`ALTER TABLE "products" DROP CONSTRAINT "FK_products_category"`);
        await queryRunner.query(`DROP INDEX "public"."ix_products_status"`);
        await queryRunner.query(`DROP INDEX "public"."ix_products_category_id"`);
        await queryRunner.query(`DROP TABLE "products"`);
        await queryRunner.query(`ALTER TABLE "categories" DROP CONSTRAINT "FK_categories_parent"`);
        await queryRunner.query(`DROP TABLE "categories"`);
        await queryRunner.query(`DROP TYPE "public"."products_status_enum"`);
    }

}
