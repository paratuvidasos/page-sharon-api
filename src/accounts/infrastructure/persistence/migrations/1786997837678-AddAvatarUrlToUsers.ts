import { MigrationInterface, QueryRunner } from "typeorm";

export class AddAvatarUrlToUsers1786997837678 implements MigrationInterface {
    name = 'AddAvatarUrlToUsers1786997837678'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ADD "avatar_url" character varying(500)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "avatar_url"`);
    }

}
