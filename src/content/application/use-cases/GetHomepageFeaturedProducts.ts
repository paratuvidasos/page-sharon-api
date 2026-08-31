import { Locale } from "../../../shared-kernel/domain/enums/Locale";
import { AutomaticFeaturedRule } from "../../domain/enums/AutomaticFeaturedRule";
import { FeaturedSelectionMode } from "../../domain/enums/FeaturedSelectionMode";
import { HomepageFeaturedConfigRepository } from "../../domain/repositories/HomepageFeaturedConfigRepository";

export interface FeaturedProductItem {
  id: string;
  slug: string;
  name: string;
  thumbnailUrl: string | null;
  basePrice: number;
  compareAtPrice: number | null;
}

/** Puerto expuesto por `catalog` — ver `GetProductsByIds`. */
export interface GetProductsByIdsPort {
  execute(input: { productIds: string[]; locale: Locale }): Promise<FeaturedProductItem[]>;
}

/** Puerto expuesto por `catalog` — ver `ListTopSellingProducts`/`ListNewestProducts`. */
export interface ListProductsPort {
  execute(input: { limit: number; locale: Locale }): Promise<FeaturedProductItem[]>;
}

const DEFAULT_LIMIT = 8;

/**
 * [0066]: productos destacados para la home pública — sin auth. En modo
 * `MANUAL` resuelve los ids elegidos por el admin contra el catálogo
 * vigente (un id archivado/borrado simplemente no aparece); en `AUTOMATIC`
 * delega en la regla configurada (más vendidos o novedades). Todo vía
 * puertos de `catalog`, nunca importando su infraestructura (regla 2 del
 * CLAUDE.md del repo).
 */
export class GetHomepageFeaturedProducts {
  constructor(
    private readonly homepageFeaturedConfigRepository: HomepageFeaturedConfigRepository,
    private readonly getProductsByIdsPort: GetProductsByIdsPort,
    private readonly listTopSellingPort: ListProductsPort,
    private readonly listNewestPort: ListProductsPort,
  ) {}

  async execute(input: { limit?: number; locale: Locale }): Promise<FeaturedProductItem[]> {
    const config = await this.homepageFeaturedConfigRepository.get();
    const limit = input.limit ?? DEFAULT_LIMIT;

    if (config.mode === FeaturedSelectionMode.MANUAL) {
      return this.getProductsByIdsPort.execute({ productIds: config.manualProductIds, locale: input.locale });
    }

    return config.automaticRule === AutomaticFeaturedRule.NEWEST
      ? this.listNewestPort.execute({ limit, locale: input.locale })
      : this.listTopSellingPort.execute({ limit, locale: input.locale });
  }
}
