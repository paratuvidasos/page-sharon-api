import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateCouponsTable1787582662682 implements MigrationInterface {
    name = 'CreateCouponsTable1787582662682'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."coupons_discount_type_enum" AS ENUM('PERCENTAGE', 'FIXED_AMOUNT')`);
        await queryRunner.query(`CREATE TABLE "coupons" ("id" uuid NOT NULL DEFAULT uuidv7(), "code" character varying(40) NOT NULL, "discount_type" "public"."coupons_discount_type_enum" NOT NULL, "discount_value" numeric(10,2) NOT NULL, "min_purchase_amount" numeric(10,2), "starts_at" TIMESTAMP WITH TIME ZONE, "ends_at" TIMESTAMP WITH TIME ZONE, "is_active" boolean NOT NULL DEFAULT true, "max_redemptions" integer, "redemptions_count" integer NOT NULL DEFAULT 0, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_coupons_code" UNIQUE ("code"), CONSTRAINT "PK_coupons" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "coupons"`);
        await queryRunner.query(`DROP TYPE "public"."coupons_discount_type_enum"`);
    }

}
