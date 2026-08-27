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

  // [0059]: null = usar el umbral global (LOW_STOCK_THRESHOLD).
  @Column({ name: "low_stock_threshold", type: "int", nullable: true })
  lowStockThreshold!: number | null;

  @Column({ name: "image_url", type: "varchar", length: 500, nullable: true })
  imageUrl!: string | null;

  // [0048]: datos del bulto para cotizar con la transportadora. Van en la
  // variante y no en el producto porque dos presentaciones del mismo producto
  // pesan distinto. Cero/NULL = todavía no se midió.
  @Column({ name: "weight_grams", type: "int", default: 0 })
  weightGrams!: number;

  @Column({ name: "length_cm", type: "numeric", precision: 6, scale: 2, nullable: true })
  lengthCm!: string | null;

  @Column({ name: "width_cm", type: "numeric", precision: 6, scale: 2, nullable: true })
  widthCm!: string | null;

  @Column({ name: "height_cm", type: "numeric", precision: 6, scale: 2, nullable: true })
  heightCm!: string | null;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;
}
