import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryColumn,
  UpdateDateColumn,
} from "typeorm";
import { OrderStatus } from "../../../domain/enums/OrderStatus";
import { PaymentMethod } from "../../../domain/enums/PaymentMethod";

// Sin FK a "users": orders es dueño de sus propias tablas y no cruza
// esquemas con el módulo accounts (ver regla 4 del CLAUDE.md del repo).
@Entity({ name: "orders" })
@Index("ix_orders_user_id_placed_at", ["userId", "placedAt"])
export class OrderOrmEntity {
  @PrimaryColumn("uuid", { default: () => "uuidv7()" })
  id!: string;

  @Column({ name: "user_id", type: "uuid" })
  userId!: string;

  @Column({ name: "order_number", type: "varchar", length: 30, unique: true })
  orderNumber!: string;

  @Column({ type: "enum", enum: OrderStatus, default: OrderStatus.PENDING })
  status!: OrderStatus;

  @Column({ type: "varchar", length: 3, default: "COP" })
  currency!: string;

  @Column({ type: "decimal", precision: 10, scale: 2 })
  subtotal!: string;

  @Column({ name: "shipping_cost", type: "decimal", precision: 10, scale: 2 })
  shippingCost!: string;

  @Column({ type: "decimal", precision: 10, scale: 2 })
  total!: string;

  @Column({ name: "payment_method", type: "enum", enum: PaymentMethod })
  paymentMethod!: PaymentMethod;

  @Column({ name: "payment_method_label", type: "varchar", length: 100, nullable: true })
  paymentMethodLabel!: string | null;

  // Snapshot de la dirección de envío al momento de comprar: no referencia
  // user_addresses porque esa fila puede editarse o borrarse después.
  @Column({ name: "shipping_recipient_name", type: "varchar", length: 150 })
  shippingRecipientName!: string;

  @Column({ name: "shipping_phone", type: "varchar", length: 30 })
  shippingPhone!: string;

  @Column({ name: "shipping_country_code", type: "char", length: 2 })
  shippingCountryCode!: string;

  @Column({ name: "shipping_state_province", type: "varchar", length: 100 })
  shippingStateProvince!: string;

  @Column({ name: "shipping_city", type: "varchar", length: 100 })
  shippingCity!: string;

  @Column({ name: "shipping_postal_code", type: "varchar", length: 20 })
  shippingPostalCode!: string;

  @Column({ name: "shipping_street_line1", type: "varchar", length: 200 })
  shippingStreetLine1!: string;

  @Column({ name: "shipping_street_line2", type: "varchar", length: 200, nullable: true })
  shippingStreetLine2!: string | null;

  @Column({ name: "placed_at", type: "timestamptz" })
  placedAt!: Date;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt!: Date;
}
