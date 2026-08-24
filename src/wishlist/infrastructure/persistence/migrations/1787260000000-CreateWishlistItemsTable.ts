import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateWishlistItemsTable1787260000000 implements MigrationInterface {
    name = 'CreateWishlistItemsTable1787260000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "wishlist_items" ("id" uuid NOT NULL DEFAULT uuidv7(), "user_id" uuid NOT NULL, "product_id" uuid NOT NULL, "added_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_wishlist_items" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "ix_wishlist_items_user_id" ON "wishlist_items" ("user_id") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "ux_wishlist_items_user_id_product_id" ON "wishlist_items" ("user_id", "product_id") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."ux_wishlist_items_user_id_product_id"`);
        await queryRunner.query(`DROP INDEX "public"."ix_wishlist_items_user_id"`);
        await queryRunner.query(`DROP TABLE "wishlist_items"`);
    }

}
