import { MigrationInterface, QueryRunner } from "typeorm";

export class AddFullTextSearchToProducts1787327044252 implements MigrationInterface {
    name = 'AddFullTextSearchToProducts1787327044252'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Columna generada (no mapeada en ProductOrmEntity: se consulta solo
        // con SQL crudo desde TypeOrmProductQueryRepository, nunca a través
        // del mapper de escritura del agregado).
        await queryRunner.query(`ALTER TABLE "products" ADD COLUMN "search_vector" tsvector GENERATED ALWAYS AS (to_tsvector('spanish', coalesce("name", '') || ' ' || coalesce("brand", '') || ' ' || coalesce("description", '') || ' ' || coalesce("ingredients", ''))) STORED`);
        await queryRunner.query(`CREATE INDEX "ix_products_search_vector" ON "products" USING GIN ("search_vector")`);
        await queryRunner.query(`CREATE INDEX "ix_products_name_lower" ON "products" (lower("name"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."ix_products_name_lower"`);
        await queryRunner.query(`DROP INDEX "public"."ix_products_search_vector"`);
        await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "search_vector"`);
    }

}
