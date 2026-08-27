import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * [0058]: vocabulario controlado de atributos de producto (tipo de cabello,
 * línea, ingrediente), gestionado desde el panel administrativo.
 */
export class CreateAttributeDefinitionsTable1787680000001 implements MigrationInterface {
    name = 'CreateAttributeDefinitionsTable1787680000001'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "attribute_definitions" ("id" uuid NOT NULL DEFAULT uuidv7(), "key" character varying(60) NOT NULL, "label" character varying(150) NOT NULL, "values" jsonb NOT NULL DEFAULT '[]', "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(), "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(), CONSTRAINT "UQ_attribute_definitions_key" UNIQUE ("key"), CONSTRAINT "PK_attribute_definitions" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "attribute_definitions"`);
    }
}
