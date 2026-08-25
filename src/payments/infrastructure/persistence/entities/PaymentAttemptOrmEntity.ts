import { Column, CreateDateColumn, Entity, Index, PrimaryColumn, UpdateDateColumn } from "typeorm";
import { Currency } from "../../../../shared-kernel/domain/enums/Currency";
import { PaymentMethod } from "../../../../shared-kernel/domain/enums/PaymentMethod";
import { PaymentProvider } from "../../../domain/enums/PaymentProvider";
import { PaymentStatus } from "../../../domain/enums/PaymentStatus";

// Sin FK a "orders": payments es dueño de sus propias tablas y no cruza
// esquemas con el módulo orders (ver regla 4 del CLAUDE.md del repo).
@Entity({ name: "payment_attempts" })
@Index("ix_payment_attempts_order_id", ["orderId"])
export class PaymentAttemptOrmEntity {
  @PrimaryColumn("uuid", { default: () => "uuidv7()" })
  id!: string;

  @Column({ name: "order_id", type: "uuid" })
  orderId!: string;

  // La referencia que viaja a la pasarela (`data-order-id` en Bold). Única
  // porque Bold rechaza referencias repetidas, y porque es la llave por la
  // que se resuelve el webhook de vuelta.
  @Column({ name: "reference_id", type: "varchar", length: 60, unique: true })
  referenceId!: string;

  @Column({ type: "enum", enum: PaymentProvider, default: PaymentProvider.BOLD })
  provider!: PaymentProvider;

  // Id de la transacción del lado de la pasarela. Es la llave de idempotencia
  // del webhook: Bold reintenta hasta 5 veces y puede reenviar uno ya
  // procesado.
  @Column({ name: "provider_payment_id", type: "varchar", length: 100, nullable: true })
  @Index("ix_payment_attempts_provider_payment_id")
  providerPaymentId!: string | null;

  @Column({ type: "decimal", precision: 12, scale: 2 })
  amount!: string;

  @Column({ type: "enum", enum: Currency, default: Currency.COP })
  currency!: Currency;

  @Column({ type: "enum", enum: PaymentStatus, default: PaymentStatus.CREATED })
  status!: PaymentStatus;

  @Column({ name: "payment_method", type: "enum", enum: PaymentMethod, nullable: true })
  paymentMethod!: PaymentMethod | null;

  // Código crudo de la pasarela: se guarda para diagnóstico, pero nunca se le
  // muestra al comprador — [0040] exige un mensaje sin jerga técnica.
  @Column({ name: "failure_code", type: "varchar", length: 60, nullable: true })
  failureCode!: string | null;

  @Column({ name: "failure_reason", type: "varchar", length: 300, nullable: true })
  failureReason!: string | null;

  @Column({ name: "expires_at", type: "timestamptz" })
  expiresAt!: Date;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt!: Date;
}
