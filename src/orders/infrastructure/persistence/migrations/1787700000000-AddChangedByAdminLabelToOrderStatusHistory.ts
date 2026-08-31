import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * [0060]: "cada cambio de estado queda registrado con fecha y usuario
 * administrador que lo realizó" (AC). Snapshot de texto (email del admin),
 * no FK — ver comentario en `Order.OrderStatusChange`.
 */
export class AddChangedByAdminLabelToOrderStatusHistory1787700000000 implements MigrationInterface {
    name = 'AddChangedByAdminLabelToOrderStatusHistory1787700000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "order_status_history" ADD "changed_by_admin_label" character varying(200)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "order_status_history" DROP COLUMN "changed_by_admin_label"`);
    }
}
