import { MigrationInterface, QueryRunner } from "typeorm";

export class AddClerkUserIdToUsers1787200000000 implements MigrationInterface {
    name = 'AddClerkUserIdToUsers1787200000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "password_hash" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "users" ADD "clerk_user_id" character varying(255)`);
        await queryRunner.query(
            `CREATE UNIQUE INDEX "ux_users_clerk_user_id_active" ON "users" ("clerk_user_id") WHERE "deleted_at" IS NULL`,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."ux_users_clerk_user_id_active"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "clerk_user_id"`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "password_hash" SET NOT NULL`);
    }

}
