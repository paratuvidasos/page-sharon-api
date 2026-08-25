import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * [0049]: cobertura por código postal y restricciones de producto por zona.
 *
 * Hasta ahora una zona solo distinguía país y departamento, que alcanza para
 * vender dentro de Colombia pero no para decidir a qué regiones de otro país
 * se llega. `postal_code_patterns` guarda patrones LIKE y no rangos porque los
 * formatos de código postal no son comparables entre países.
 *
 * `shipping_zone_product_restrictions` no tiene FK a `products`: esa tabla es
 * de `catalog` y ningún módulo cruza esquemas con otro (regla 4 del CLAUDE.md
 * del repo). El borrado de un producto no limpia sus restricciones, y no pasa
 * nada: una restricción huérfana no restringe nada.
 */
export class AddZoneCoverageAndRestrictions1787674091348 implements MigrationInterface {
    name = 'AddZoneCoverageAndRestrictions1787674091348'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "shipping_zones" ADD COLUMN "postal_code_patterns" text array`);

        await queryRunner.query(`CREATE TABLE "shipping_zone_product_restrictions" ("id" uuid NOT NULL DEFAULT uuidv7(), "zone_id" uuid NOT NULL, "product_id" uuid NOT NULL, "reason" character varying(200), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_shipping_zone_product_restrictions" PRIMARY KEY ("id"), CONSTRAINT "FK_zone_product_restrictions_zone" FOREIGN KEY ("zone_id") REFERENCES "shipping_zones"("id") ON DELETE CASCADE)`);
        await queryRunner.query(`CREATE UNIQUE INDEX "ux_zone_product_restriction" ON "shipping_zone_product_restrictions" ("zone_id", "product_id")`);
        await queryRunner.query(`CREATE INDEX "ix_zone_product_restrictions_product_id" ON "shipping_zone_product_restrictions" ("product_id")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "shipping_zone_product_restrictions"`);
        await queryRunner.query(`ALTER TABLE "shipping_zones" DROP COLUMN "postal_code_patterns"`);
    }

}
