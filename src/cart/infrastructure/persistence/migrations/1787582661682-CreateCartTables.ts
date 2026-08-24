import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateCartTables1787582661682 implements MigrationInterface {
    name = 'CreateCartTables1787582661682'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."carts_owner_type_enum" AS ENUM('USER', 'GUEST')`);
        await queryRunner.query(`CREATE TABLE "carts" ("id" uuid NOT NULL DEFAULT uuidv7(), "owner_type" "public"."carts_owner_type_enum" NOT NULL, "user_id" uuid, "guest_id" uuid, "coupon_code" character varying(40), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_carts_user_id" UNIQUE ("user_id"), CONSTRAINT "UQ_carts_guest_id" UNIQUE ("guest_id"), CONSTRAINT "PK_carts" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "ix_carts_user_id" ON "carts" ("user_id") `);
        await queryRunner.query(`CREATE INDEX "ix_carts_guest_id" ON "carts" ("guest_id") `);
        await queryRunner.query(`CREATE TABLE "cart_items" ("id" uuid NOT NULL DEFAULT uuidv7(), "cart_id" uuid NOT NULL, "product_id" uuid NOT NULL, "variant_id" uuid NOT NULL, "quantity" integer NOT NULL, "price_at_addition" numeric(10,2) NOT NULL, "added_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_cart_items" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "ix_cart_items_cart_id" ON "cart_items" ("cart_id") `);
        await queryRunner.query(`ALTER TABLE "cart_items" ADD CONSTRAINT "FK_cart_items_cart" FOREIGN KEY ("cart_id") REFERENCES "carts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "cart_items" DROP CONSTRAINT "FK_cart_items_cart"`);
        await queryRunner.query(`DROP INDEX "public"."ix_cart_items_cart_id"`);
        await queryRunner.query(`DROP TABLE "cart_items"`);
        await queryRunner.query(`DROP INDEX "public"."ix_carts_guest_id"`);
        await queryRunner.query(`DROP INDEX "public"."ix_carts_user_id"`);
        await queryRunner.query(`DROP TABLE "carts"`);
        await queryRunner.query(`DROP TYPE "public"."carts_owner_type_enum"`);
    }

}
