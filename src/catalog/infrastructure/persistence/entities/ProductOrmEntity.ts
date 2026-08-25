import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryColumn,
  UpdateDateColumn,
} from "typeorm";
import { ProductStatus } from "../../../domain/enums/ProductStatus";
import { ProductVariantOrmEntity } from "./ProductVariantOrmEntity";

// category_id es un uuid simple, sin relación de TypeORM: Product y
// Category son agregados distintos dentro del mismo módulo, y las lecturas
// que necesiten datos de categoría los piden con un join explícito en el
// *QueryRepository, no con una relación perezosa (ver "Repository pattern"
// y "Queries" del CLAUDE.md del repo).
@Entity({ name: "products" })
export class ProductOrmEntity {
  @PrimaryColumn("uuid", { default: () => "uuidv7()" })
  id!: string;

  @Column({ name: "category_id", type: "uuid" })
  @Index("ix_products_category_id")
  categoryId!: string;

  @Column({ type: "varchar", length: 200 })
  name!: string;

  @Column({ type: "varchar", length: 220, unique: true })
  slug!: string;

  @Column({ type: "text" })
  description!: string;

  @Column({ type: "varchar", length: 120, nullable: true })
  brand!: string | null;

  @Column({ type: "text", nullable: true })
  ingredients!: string | null;

  @Column({ type: "jsonb", default: {} })
  attributes!: Record<string, string>;

  @Column({ name: "base_price", type: "numeric", precision: 10, scale: 2 })
  basePrice!: string;

  @Column({ name: "compare_at_price", type: "numeric", precision: 10, scale: 2, nullable: true })
  compareAtPrice!: string | null;

  @Column({ type: "enum", enum: ProductStatus, default: ProductStatus.ACTIVE })
  @Index("ix_products_status")
  status!: ProductStatus;

  @Column({ type: "jsonb", default: [] })
  images!: string[];

  // Incrementado por RecordProductSale al escuchar OrderPaid (evento de
  // `orders`, ver [0019]) — nunca a través de ProductMapper/save() del
  // agregado, sino con un UPDATE atómico (Repository.increment).
  @Column({ name: "sales_count", type: "int", default: 0 })
  @Index("ix_products_sales_count")
  salesCount!: number;

  // Configurable desde el panel administrativo ([0022]) — actualizado con
  // Repository.update, no a través de ProductMapper/save() del agregado
  // (mismo motivo que sales_count: no es una invariante de negocio del
  // dominio Product).
  @Column({ name: "is_featured", type: "boolean", default: false })
  @Index("ix_products_is_featured")
  isFeatured!: boolean;

  @OneToMany(() => ProductVariantOrmEntity, (variant) => variant.product, { cascade: true })
  variants!: ProductVariantOrmEntity[];

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt!: Date;
}
