import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryColumn } from "typeorm";
import { Locale } from "../../../../shared-kernel/domain/enums/Locale";
import { ProductOrmEntity } from "./ProductOrmEntity";

@Entity({ name: "product_translations" })
@Index("ux_product_translations_product_id_locale", ["productId", "locale"], { unique: true })
export class ProductTranslationOrmEntity {
  @PrimaryColumn("uuid", { default: () => "uuidv7()" })
  id!: string;

  @Column({ name: "product_id", type: "uuid" })
  productId!: string;

  @ManyToOne(() => ProductOrmEntity, (product) => product.translations, { onDelete: "CASCADE" })
  @JoinColumn({ name: "product_id" })
  product!: ProductOrmEntity;

  @Column({ type: "enum", enum: Locale })
  locale!: Locale;

  @Column({ type: "varchar", length: 200 })
  name!: string;

  @Column({ type: "text" })
  description!: string;
}
