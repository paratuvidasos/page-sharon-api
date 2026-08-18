import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateOrdersTables1787058915337 implements MigrationInterface {
    name = 'CreateOrdersTables1787058915337'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."orders_status_enum" AS ENUM('PENDING', 'PAID', 'IN_PREPARATION', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED')`);
        await queryRunner.query(`CREATE TYPE "public"."orders_payment_method_enum" AS ENUM('CREDIT_CARD', 'DEBIT_CARD', 'PAYPAL', 'BANK_TRANSFER', 'CASH_ON_DELIVERY')`);
        await queryRunner.query(`CREATE TABLE "orders" ("id" uuid NOT NULL DEFAULT uuidv7(), "user_id" uuid NOT NULL, "order_number" character varying(30) NOT NULL, "status" "public"."orders_status_enum" NOT NULL DEFAULT 'PENDING', "currency" character varying(3) NOT NULL DEFAULT 'COP', "subtotal" numeric(10,2) NOT NULL, "shipping_cost" numeric(10,2) NOT NULL, "total" numeric(10,2) NOT NULL, "payment_method" "public"."orders_payment_method_enum" NOT NULL, "payment_method_label" character varying(100), "shipping_recipient_name" character varying(150) NOT NULL, "shipping_phone" character varying(30) NOT NULL, "shipping_country_code" character(2) NOT NULL, "shipping_state_province" character varying(100) NOT NULL, "shipping_city" character varying(100) NOT NULL, "shipping_postal_code" character varying(20) NOT NULL, "shipping_street_line1" character varying(200) NOT NULL, "shipping_street_line2" character varying(200), "placed_at" TIMESTAMP WITH TIME ZONE NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_e64e550997ba9d5c5a534d1d8ce" UNIQUE ("order_number"), CONSTRAINT "PK_710e2d4957aa5878dfe94e4ac2f" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "ix_orders_user_id_placed_at" ON "orders" ("user_id", "placed_at") `);
        await queryRunner.query(`CREATE TABLE "order_items" ("id" uuid NOT NULL DEFAULT uuidv7(), "order_id" uuid NOT NULL, "product_id" uuid NOT NULL, "product_name" character varying(200) NOT NULL, "sku" character varying(50) NOT NULL, "unit_price" numeric(10,2) NOT NULL, "quantity" integer NOT NULL, "line_total" numeric(10,2) NOT NULL, CONSTRAINT "PK_005269d8574e6fac0493715c308" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "ix_order_items_order_id" ON "order_items" ("order_id") `);
        await queryRunner.query(`ALTER TABLE "order_items" ADD CONSTRAINT "FK_646bf9ece6f45dbe41c203e06e0" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "order_items" DROP CONSTRAINT "FK_646bf9ece6f45dbe41c203e06e0"`);
        await queryRunner.query(`DROP INDEX "public"."ix_order_items_order_id"`);
        await queryRunner.query(`DROP TABLE "order_items"`);
        await queryRunner.query(`DROP INDEX "public"."ix_orders_user_id_placed_at"`);
        await queryRunner.query(`DROP TABLE "orders"`);
        await queryRunner.query(`DROP TYPE "public"."orders_payment_method_enum"`);
        await queryRunner.query(`DROP TYPE "public"."orders_status_enum"`);
    }

}
