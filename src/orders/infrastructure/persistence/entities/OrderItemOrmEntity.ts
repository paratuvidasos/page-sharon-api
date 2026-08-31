import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryColumn } from "typeorm";
import { OrderOrmEntity } from "./OrderOrmEntity";

@Entity({ name: "order_items" })
export class OrderItemOrmEntity {
  @PrimaryColumn("uuid", { default: () => "uuidv7()" })
  id!: string;

  @Column({ name: "order_id", type: "uuid" })
  @Index("ix_order_items_order_id")
  orderId!: string;

  @ManyToOne(() => OrderOrmEntity, { onDelete: "CASCADE" })
  @JoinColumn({ name: "order_id" })
  order!: OrderOrmEntity;

  // Sin FK a catalog.products: orders guarda un snapshot del producto al
  // momento de comprar, no una referencia viva al catálogo (regla 4).
  @Column({ name: "product_id", type: "uuid" })
  productId!: string;

  // La variante es lo que realmente tiene stock, así que es lo que hay que
  // apartar y devolver ([0038]). El producto solo alcanzaba para el contador
  // de ventas.
  @Column({ name: "variant_id", type: "uuid" })
  variantId!: string;

  @Column({ name: "product_name", type: "varchar", length: 200 })
  productName!: string;

  @Column({ type: "varchar", length: 50 })
  sku!: string;

  @Column({ name: "unit_price", type: "decimal", precision: 10, scale: 2 })
  unitPrice!: string;

  @Column({ type: "int" })
  quantity!: number;

  @Column({ name: "line_total", type: "decimal", precision: 10, scale: 2 })
  lineTotal!: string;
}
