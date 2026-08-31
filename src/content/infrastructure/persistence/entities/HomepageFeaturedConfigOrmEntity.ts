import { Column, Entity, PrimaryColumn } from "typeorm";
import { AutomaticFeaturedRule } from "../../../domain/enums/AutomaticFeaturedRule";
import { FeaturedSelectionMode } from "../../../domain/enums/FeaturedSelectionMode";

/** Singleton: una sola fila, con `id = 'default'` (ver `HOMEPAGE_FEATURED_CONFIG_ID`). */
@Entity({ name: "homepage_featured_config" })
export class HomepageFeaturedConfigOrmEntity {
  @PrimaryColumn("varchar", { length: 20 })
  id!: string;

  @Column({ type: "enum", enum: FeaturedSelectionMode })
  mode!: FeaturedSelectionMode;

  @Column({ name: "manual_product_ids", type: "uuid", array: true, default: () => "'{}'" })
  manualProductIds!: string[];

  @Column({ name: "automatic_rule", type: "enum", enum: AutomaticFeaturedRule })
  automaticRule!: AutomaticFeaturedRule;
}
