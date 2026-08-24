import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateReviewsTable1787327575694 implements MigrationInterface {
    name = 'CreateReviewsTable1787327575694'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "reviews" ("id" uuid NOT NULL DEFAULT uuidv7(), "product_id" uuid NOT NULL, "user_id" uuid NOT NULL, "rating" smallint NOT NULL, "comment" text NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "CHK_reviews_rating_range" CHECK ("rating" >= 1 AND "rating" <= 5), CONSTRAINT "PK_reviews" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "ix_reviews_product_id" ON "reviews" ("product_id") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "ux_reviews_product_id_user_id" ON "reviews" ("product_id", "user_id") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."ux_reviews_product_id_user_id"`);
        await queryRunner.query(`DROP INDEX "public"."ix_reviews_product_id"`);
        await queryRunner.query(`DROP TABLE "reviews"`);
    }

}
