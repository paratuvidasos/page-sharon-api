import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * [0036]: intentos de pago contra la pasarela.
 *
 * Un pedido puede tener varios: [0040] permite reintentar tras un rechazo, y
 * Bold exige que la referencia enviada sea única, así que cada reintento crea
 * una fila nueva y el historial de rechazos se conserva.
 *
 * No se guarda ningún dato de tarjeta — con el Botón de Pagos esos datos van
 * del navegador a Bold sin pasar por acá ([0036]).
 */
export class CreatePaymentAttemptsTable1787598475270 implements MigrationInterface {
    name = 'CreatePaymentAttemptsTable1787598475270'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."payment_attempts_provider_enum" AS ENUM('BOLD')`);
        await queryRunner.query(`CREATE TYPE "public"."payment_attempts_currency_enum" AS ENUM('COP', 'USD')`);
        await queryRunner.query(`CREATE TYPE "public"."payment_attempts_status_enum" AS ENUM('CREATED', 'PROCESSING', 'PENDING', 'APPROVED', 'REJECTED', 'FAILED', 'VOIDED', 'EXPIRED')`);
        await queryRunner.query(`CREATE TYPE "public"."payment_attempts_payment_method_enum" AS ENUM('CREDIT_CARD', 'DEBIT_CARD', 'PAYPAL', 'BANK_TRANSFER', 'CASH_ON_DELIVERY', 'PSE', 'NEQUI', 'BANCOLOMBIA_BUTTON')`);
        await queryRunner.query(`CREATE TABLE "payment_attempts" ("id" uuid NOT NULL DEFAULT uuidv7(), "order_id" uuid NOT NULL, "reference_id" character varying(60) NOT NULL, "provider" "public"."payment_attempts_provider_enum" NOT NULL DEFAULT 'BOLD', "provider_payment_id" character varying(100), "amount" numeric(12,2) NOT NULL, "currency" "public"."payment_attempts_currency_enum" NOT NULL DEFAULT 'COP', "status" "public"."payment_attempts_status_enum" NOT NULL DEFAULT 'CREATED', "payment_method" "public"."payment_attempts_payment_method_enum", "failure_code" character varying(60), "failure_reason" character varying(300), "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_payment_attempts_reference_id" UNIQUE ("reference_id"), CONSTRAINT "PK_payment_attempts" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "ix_payment_attempts_order_id" ON "payment_attempts" ("order_id")`);
        await queryRunner.query(`CREATE INDEX "ix_payment_attempts_provider_payment_id" ON "payment_attempts" ("provider_payment_id")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "payment_attempts"`);
        await queryRunner.query(`DROP TYPE "public"."payment_attempts_payment_method_enum"`);
        await queryRunner.query(`DROP TYPE "public"."payment_attempts_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."payment_attempts_currency_enum"`);
        await queryRunner.query(`DROP TYPE "public"."payment_attempts_provider_enum"`);
    }

}
