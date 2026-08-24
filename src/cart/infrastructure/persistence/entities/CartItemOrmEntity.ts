import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryColumn } from "typeorm";
import { CartOrmEntity } from "./CartOrmEntity";

@Entity({ name: "cart_items" })
export class CartItemOrmEntity {
  @PrimaryColumn("uuid", { default: () => "uuidv7()" })
  id!: string;

  @Column({ name: "cart_id", type: "uuid" })
  @Index("ix_cart_items_cart_id")
  cartId!: string;

  @ManyToOne(() => CartOrmEntity, (cart) => cart.items, { onDelete: "CASCADE" })
  @JoinColumn({ name: "cart_id" })
  cart!: CartOrmEntity;

  @Column({ name: "product_id", type: "uuid" })
  productId!: string;

  @Column({ name: "variant_id", type: "uuid" })
  variantId!: string;

  @Column({ type: "int" })
  quantity!: number;

  @Column({ name: "price_at_addition", type: "numeric", precision: 10, scale: 2 })
  priceAtAddition!: string;

  @CreateDateColumn({ name: "added_at", type: "timestamptz" })
  addedAt!: Date;
}
