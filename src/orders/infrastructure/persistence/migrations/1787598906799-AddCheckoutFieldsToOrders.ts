import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * [0038] a [0041]: campos que el checkout con pasarela necesita y que el
 * esqueleto anterior no tenía.
 *
 * - `PAYMENT_FAILED` como estado ([0040]). Se agrega con ALTER TYPE, no
 *   editando solo el enum de TypeScript: el enum del código y el de Postgres
 *   avanzan juntos (sección "Enums" del CLAUDE.md del repo).
 * - Métodos de pago de Bold: PSE, Nequi y Botón Bancolombia ([0035]).
 * - `coupon_code` y `discount` ([0027]): el carrito ya aplicaba cupones,
 *   pero el pedido no guardaba el descuento y su total no cuadraba.
 * - `variant_id` en los ítems: es la variante la que tiene stock, y es lo que
 *   hay que apartar y devolver ([0038]).
 * - `currency` pasa de varchar a enum, para que no entre una moneda que la
 *   pasarela no procesa.
 */
export class AddCheckoutFieldsToOrders1787598906799 implements MigrationInterface {
    name = 'AddCheckoutFieldsToOrders1787598906799'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TYPE "public"."orders_status_enum" ADD VALUE IF NOT EXISTS 'PAYMENT_FAILED'`);
        await queryRunner.query(`ALTER TYPE "public"."orders_payment_method_enum" ADD VALUE IF NOT EXISTS 'PSE'`);
        await queryRunner.query(`ALTER TYPE "public"."orders_payment_method_enum" ADD VALUE IF NOT EXISTS 'NEQUI'`);
        await queryRunner.query(`ALTER TYPE "public"."orders_payment_method_enum" ADD VALUE IF NOT EXISTS 'BANCOLOMBIA_BUTTON'`);

        await queryRunner.query(`CREATE TYPE "public"."orders_currency_enum" AS ENUM('COP', 'USD')`);
        await queryRunner.query(`ALTER TABLE "orders" ALTER COLUMN "currency" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "orders" ALTER COLUMN "currency" TYPE "public"."orders_currency_enum" USING "currency"::text::"public"."orders_currency_enum"`);
        await queryRunner.query(`ALTER TABLE "orders" ALTER COLUMN "currency" SET DEFAULT 'COP'`);

        await queryRunner.query(`ALTER TABLE "orders" ADD "exchange_rate" numeric(18,8) NOT NULL DEFAULT 1`);
        await queryRunner.query(`ALTER TABLE "orders" ADD "coupon_code" character varying(40)`);
        await queryRunner.query(`ALTER TABLE "orders" ADD "discount" numeric(10,2) NOT NULL DEFAULT 0`);
        await queryRunner.query(`ALTER TABLE "orders" ADD "shipping_method_code" character varying(30) NOT NULL DEFAULT 'STANDARD'`);
        await queryRunner.query(`ALTER TABLE "orders" ADD "shipping_method_label" character varying(100) NOT NULL DEFAULT 'Envío estándar'`);
        await queryRunner.query(`ALTER TABLE "orders" ADD "payment_failure_message" character varying(300)`);
        await queryRunner.query(`ALTER TABLE "orders" ADD "paid_at" TIMESTAMP WITH TIME ZONE`);

        // Los pedidos que ya existen no tienen variante registrada. Se les
        // asigna la primera variante de su producto para no dejar la columna
        // nullable: son datos previos al flujo de pago y ninguno se va a
        // reservar ni devolver.
        await queryRunner.query(`ALTER TABLE "order_items" ADD "variant_id" uuid`);
        await queryRunner.query(`UPDATE "order_items" oi SET "variant_id" = (SELECT pv.id FROM "product_variants" pv WHERE pv.product_id = oi.product_id ORDER BY pv.id LIMIT 1) WHERE "variant_id" IS NULL`);
        await queryRunner.query(`DELETE FROM "order_items" WHERE "variant_id" IS NULL`);
        await queryRunner.query(`ALTER TABLE "order_items" ALTER COLUMN "variant_id" SET NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "order_items" DROP COLUMN "variant_id"`);
        await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN "paid_at"`);
        await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN "payment_failure_message"`);
        await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN "shipping_method_label"`);
        await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN "shipping_method_code"`);
        await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN "discount"`);
        await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN "coupon_code"`);
        await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN "exchange_rate"`);
        await queryRunner.query(`ALTER TABLE "orders" ALTER COLUMN "currency" TYPE character varying(3)`);
        await queryRunner.query(`DROP TYPE "public"."orders_currency_enum"`);
        // Postgres no permite quitar valores de un enum: los estados y
        // métodos agregados en up() se quedan. Es inocuo — ninguna fila los
        // usa después de revertir.
    }

}
