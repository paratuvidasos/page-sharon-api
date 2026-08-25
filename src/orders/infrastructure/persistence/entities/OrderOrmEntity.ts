import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryColumn,
  UpdateDateColumn,
} from "typeorm";
import { Currency } from "../../../../shared-kernel/domain/enums/Currency";
import { OrderStatus } from "../../../domain/enums/OrderStatus";
import { PaymentMethod } from "../../../domain/enums/PaymentMethod";

// Sin FK a "users": orders es dueño de sus propias tablas y no cruza
// esquemas con el módulo accounts (ver regla 4 del CLAUDE.md del repo).
@Entity({ name: "orders" })
@Index("ix_orders_user_id_placed_at", ["userId", "placedAt"])
export class OrderOrmEntity {
  @PrimaryColumn("uuid", { default: () => "uuidv7()" })
  id!: string;

  @Column({ name: "user_id", type: "uuid", nullable: true })
  userId!: string | null;

  // Correo del invitado que hizo el pedido sin crear cuenta; permite
  // rastrearlo sin login. Mutuamente excluyente con user_id (ver CHECK
  // ck_orders_owner_xor en la migración).
  @Column({ name: "guest_email", type: "varchar", length: 255, nullable: true })
  @Index("ix_orders_guest_email")
  guestEmail!: string | null;

  @Column({ name: "order_number", type: "varchar", length: 30, unique: true })
  orderNumber!: string;

  @Column({ type: "enum", enum: OrderStatus, default: OrderStatus.PENDING })
  status!: OrderStatus;

  @Column({ type: "enum", enum: Currency, default: Currency.COP })
  currency!: Currency;

  // [0041]: tasa contra la moneda base, congelada al comprar. Guardarla es lo
  // que permite reconstruir después cuánto se cobró de verdad, aunque la tasa
  // del día haya cambiado.
  @Column({ name: "exchange_rate", type: "decimal", precision: 18, scale: 8, default: 1 })
  exchangeRate!: string;

  @Column({ type: "decimal", precision: 10, scale: 2 })
  subtotal!: string;

  // [0027]: el carrito ya soportaba cupones, pero el pedido no guardaba el
  // descuento; sin esto el total del pedido no cuadraba con el del carrito.
  @Column({ name: "coupon_code", type: "varchar", length: 40, nullable: true })
  couponCode!: string | null;

  @Column({ type: "decimal", precision: 10, scale: 2, default: 0 })
  discount!: string;

  @Column({ name: "shipping_cost", type: "decimal", precision: 10, scale: 2 })
  shippingCost!: string;

  // Snapshot del método de envío, no una FK a shipping_rates: esa tarifa
  // puede cambiar de precio o desactivarse después (misma razón que el
  // snapshot de dirección).
  @Column({ name: "shipping_method_code", type: "varchar", length: 30, default: "STANDARD" })
  shippingMethodCode!: string;

  @Column({ name: "shipping_method_label", type: "varchar", length: 100, default: "Envío estándar" })
  shippingMethodLabel!: string;

  @Column({ type: "decimal", precision: 10, scale: 2 })
  total!: string;

  @Column({ name: "payment_method", type: "enum", enum: PaymentMethod })
  paymentMethod!: PaymentMethod;

  @Column({ name: "payment_method_label", type: "varchar", length: 100, nullable: true })
  paymentMethodLabel!: string | null;

  // [0040]: motivo del último rechazo, ya traducido a lenguaje de usuario.
  // El código crudo de la pasarela vive en payment_attempts, no aquí.
  @Column({ name: "payment_failure_message", type: "varchar", length: 300, nullable: true })
  paymentFailureMessage!: string | null;

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

  @Column({ name: "paid_at", type: "timestamptz", nullable: true })
  paidAt!: Date | null;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt!: Date;
}
