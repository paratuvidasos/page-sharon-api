import { MigrationInterface, QueryRunner } from "typeorm";

export class AddEmployeeRoleAndJobTitleToUsers1787900000000 implements MigrationInterface {
    name = 'AddEmployeeRoleAndJobTitleToUsers1787900000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TYPE "public"."users_role_enum" ADD VALUE 'EMPLOYEE'`);
        await queryRunner.query(`ALTER TABLE "users" ADD "job_title" character varying(150)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "job_title"`);
        // Postgres no permite quitar un valor de un enum sin recrear el tipo;
        // se deja el valor 'EMPLOYEE' en el tipo (no rompe nada que no lo use).
    }

}
