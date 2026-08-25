import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * [0034]: zonas de cobertura y tarifas de envío.
 *
 * El seed replica exactamente la regla que hasta ahora vivía hardcodeada en
 * el frontend (envío gratis desde $150.000, si no $9.900), para que mover el
 * cálculo al backend no le cambie el precio a nadie de un día para otro. Las
 * tarifas EXPRESS y PICKUP se agregan porque [0034] pide "opciones" en
 * plural: con una sola no hay nada que elegir.
 */
export class CreateShippingTables1787598187090 implements MigrationInterface {
    name = 'CreateShippingTables1787598187090'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."shipping_rates_method_enum" AS ENUM('STANDARD', 'EXPRESS', 'PICKUP')`);
        await queryRunner.query(`CREATE TYPE "public"."shipping_rates_currency_enum" AS ENUM('COP', 'USD')`);
        await queryRunner.query(`CREATE TABLE "shipping_zones" ("id" uuid NOT NULL DEFAULT uuidv7(), "name" character varying(100) NOT NULL, "country_code" character(2) NOT NULL, "state_provinces" text array, "priority" integer NOT NULL DEFAULT 0, "is_active" boolean NOT NULL DEFAULT true, CONSTRAINT "PK_shipping_zones" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "ix_shipping_zones_country_code" ON "shipping_zones" ("country_code")`);
        await queryRunner.query(`CREATE TABLE "shipping_rates" ("id" uuid NOT NULL DEFAULT uuidv7(), "zone_id" uuid NOT NULL, "method" "public"."shipping_rates_method_enum" NOT NULL, "label" character varying(100) NOT NULL, "cost" numeric(10,2) NOT NULL, "currency" "public"."shipping_rates_currency_enum" NOT NULL DEFAULT 'COP', "estimated_min_days" integer NOT NULL, "estimated_max_days" integer NOT NULL, "free_shipping_threshold" numeric(10,2), "is_active" boolean NOT NULL DEFAULT true, CONSTRAINT "PK_shipping_rates" PRIMARY KEY ("id"), CONSTRAINT "FK_shipping_rates_zone" FOREIGN KEY ("zone_id") REFERENCES "shipping_zones"("id") ON DELETE CASCADE)`);
        await queryRunner.query(`CREATE INDEX "ix_shipping_rates_zone_id_method" ON "shipping_rates" ("zone_id", "method")`);

        await queryRunner.query(`INSERT INTO "shipping_zones" ("id", "name", "country_code", "state_provinces", "priority") VALUES ('01920000-0000-7000-8000-000000000001', 'Colombia (nacional)', 'CO', NULL, 0)`);
        await queryRunner.query(`INSERT INTO "shipping_rates" ("zone_id", "method", "label", "cost", "currency", "estimated_min_days", "estimated_max_days", "free_shipping_threshold") VALUES
            ('01920000-0000-7000-8000-000000000001', 'STANDARD', 'Envío estándar', 9900, 'COP', 3, 5, 150000),
            ('01920000-0000-7000-8000-000000000001', 'EXPRESS', 'Envío exprés', 19900, 'COP', 1, 2, NULL),
            ('01920000-0000-7000-8000-000000000001', 'PICKUP', 'Recoger en tienda', 0, 'COP', 1, 2, NULL)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "shipping_rates"`);
        await queryRunner.query(`DROP TABLE "shipping_zones"`);
        await queryRunner.query(`DROP TYPE "public"."shipping_rates_currency_enum"`);
        await queryRunner.query(`DROP TYPE "public"."shipping_rates_method_enum"`);
    }

}
