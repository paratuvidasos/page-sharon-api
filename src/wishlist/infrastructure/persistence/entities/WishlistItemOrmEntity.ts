import { Column, CreateDateColumn, Entity, Index, PrimaryColumn } from "typeorm";

// Sin FK a "users" ni a catalog.products: wishlist es dueño de su propia
// tabla y no cruza esquemas con otros módulos (ver regla 4 del CLAUDE.md
// del repo).
@Entity({ name: "wishlist_items" })
@Index("ux_wishlist_items_user_id_product_id", ["userId", "productId"], { unique: true })
export class WishlistItemOrmEntity {
  @PrimaryColumn("uuid", { default: () => "uuidv7()" })
  id!: string;

  @Column({ name: "user_id", type: "uuid" })
  @Index("ix_wishlist_items_user_id")
  userId!: string;

  @Column({ name: "product_id", type: "uuid" })
  productId!: string;

  @CreateDateColumn({ name: "added_at", type: "timestamptz" })
  addedAt!: Date;
}
