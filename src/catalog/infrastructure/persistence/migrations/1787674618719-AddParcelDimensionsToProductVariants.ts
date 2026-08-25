import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * [0048]: peso y dimensiones por variante.
 *
 * La transportadora cotiza por bulto, no por precio: sin estos datos el
 * criterio de aceptación de [0048] ("el cálculo considera peso, dimensiones y
 * destino") es inalcanzable y la integración solo podría mandar el destino.
 *
 * Viven en la variante y no en el producto porque un shampoo de 250ml y uno
 * de 1L pesan distinto y son el mismo producto. `weight_grams` arranca en 0 y
 * no en NULL para que la columna sea NOT NULL desde el día uno: cero significa
 * "todavía no se midió", y `GetShippingOptions` trata un bulto sin peso como
 * motivo para no consultar a la transportadora y usar la tarifa de respaldo.
 */
export class AddParcelDimensionsToProductVariants1787674618719 implements MigrationInterface {
    name = 'AddParcelDimensionsToProductVariants1787674618719'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "product_variants" ADD COLUMN "weight_grams" integer NOT NULL DEFAULT 0`);
        await queryRunner.query(`ALTER TABLE "product_variants" ADD COLUMN "length_cm" numeric(6,2)`);
        await queryRunner.query(`ALTER TABLE "product_variants" ADD COLUMN "width_cm" numeric(6,2)`);
        await queryRunner.query(`ALTER TABLE "product_variants" ADD COLUMN "height_cm" numeric(6,2)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "product_variants" DROP COLUMN "height_cm"`);
        await queryRunner.query(`ALTER TABLE "product_variants" DROP COLUMN "width_cm"`);
        await queryRunner.query(`ALTER TABLE "product_variants" DROP COLUMN "length_cm"`);
        await queryRunner.query(`ALTER TABLE "product_variants" DROP COLUMN "weight_grams"`);
    }

}
