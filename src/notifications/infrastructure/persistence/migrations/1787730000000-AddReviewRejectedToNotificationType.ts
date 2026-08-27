import { MigrationInterface, QueryRunner } from "typeorm";

/** [0064]: aviso al cliente cuando el admin rechaza su reseña. */
export class AddReviewRejectedToNotificationType1787730000000 implements MigrationInterface {
    name = 'AddReviewRejectedToNotificationType1787730000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TYPE "public"."notifications_type_enum" ADD VALUE IF NOT EXISTS 'REVIEW_REJECTED'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TYPE "public"."notifications_type_enum" RENAME TO "notifications_type_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."notifications_type_enum" AS ENUM('ORDER_STATUS_CHANGED')`);
        await queryRunner.query(`ALTER TABLE "notifications" ALTER COLUMN "type" TYPE "public"."notifications_type_enum" USING "type"::text::"public"."notifications_type_enum"`);
        await queryRunner.query(`DROP TYPE "public"."notifications_type_enum_old"`);
    }
}
