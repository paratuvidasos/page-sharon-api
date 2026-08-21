import { MigrationInterface, QueryRunner } from "typeorm";

export class AddArchivedAndRequireLabelOnUserAddresses1787000371801 implements MigrationInterface {
    name = 'AddArchivedAndRequireLabelOnUserAddresses1787000371801'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_addresses" ADD "is_archived" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "user_addresses" ALTER COLUMN "label" SET NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_addresses" ALTER COLUMN "label" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "user_addresses" DROP COLUMN "is_archived"`);
    }

}
