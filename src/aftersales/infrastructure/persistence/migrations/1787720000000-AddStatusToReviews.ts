import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * [0064]: moderación de reseñas. Default APPROVED para que las reseñas ya
 * existentes sigan visibles — el comportamiento actual (auto-publicar) se
 * preserva salvo que el admin encienda REVIEWS_REQUIRE_MODERATION.
 */
export class AddStatusToReviews1787720000000 implements MigrationInterface {
    name = 'AddStatusToReviews1787720000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."reviews_status_enum" AS ENUM('PENDING', 'APPROVED', 'REJECTED', 'HIDDEN')`);
        await queryRunner.query(`ALTER TABLE "reviews" ADD "status" "public"."reviews_status_enum" NOT NULL DEFAULT 'APPROVED'`);
        await queryRunner.query(`CREATE INDEX "ix_reviews_status" ON "reviews" ("status")`);
        await queryRunner.query(`ALTER TABLE "reviews" ADD "rejection_reason" character varying(300)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "reviews" DROP COLUMN "rejection_reason"`);
        await queryRunner.query(`DROP INDEX "public"."ix_reviews_status"`);
        await queryRunner.query(`ALTER TABLE "reviews" DROP COLUMN "status"`);
        await queryRunner.query(`DROP TYPE "public"."reviews_status_enum"`);
    }
}
