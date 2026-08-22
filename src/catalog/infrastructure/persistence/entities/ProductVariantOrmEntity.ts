import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from "typeorm";
import { ProductOrmEntity } from "./ProductOrmEntity";

@Entity({ name: "product_variants" })
export class ProductVariantOrmEntity {
  @PrimaryColumn("uuid", { default: () => "uuidv7()" })
  id!: string;

  @Column({ name: "product_id", type: "uuid" })
  @Index("ix_product_variants_product_id")
  productId!: string;

  @ManyToOne(() => ProductOrmEntity, (product) => product.variants, { onDelete: "CASCADE" })
  @JoinColumn({ name: "product_id" })
  product!: ProductOrmEntity;

  @Column({ type: "varchar", length: 50, unique: true })
  sku!: string;

  @Column({ type: "varchar", length: 50, nullable: true })
  size!: string | null;

  @Column({ type: "varchar", length: 80, nullable: true })
  scent!: string | null;

  @Column({ type: "varchar", length: 50, nullable: true })
  color!: string | null;

  @Column({ name: "price_override", type: "numeric", precision: 10, scale: 2, nullable: true })
  priceOverride!: string | null;

  @Column({ name: "stock_quantity", type: "int", default: 0 })
  stockQuantity!: number;

  @Column({ name: "image_url", type: "varchar", length: 500, nullable: true })
  imageUrl!: string | null;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;
}
