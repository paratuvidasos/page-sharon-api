import { ProductQueryRepository, ProductVariantSnapshot } from "../../domain/repositories/ProductQueryRepository";

export interface GetCartProductSnapshotsInput {
  variantIds: string[];
}

/**
 * Implementa la forma de `CatalogSnapshotPort` de `cart` (ver regla 2 del
 * CLAUDE.md del repo — sin que `catalog` importe ningún tipo de `cart`,
 * mismo duck typing que ya usa `RatingSummaryPort` entre `catalog` y
 * `aftersales`).
 */
export class GetCartProductSnapshots {
  constructor(private readonly productQueryRepository: ProductQueryRepository) {}

  async execute(input: GetCartProductSnapshotsInput): Promise<ProductVariantSnapshot[]> {
    return this.productQueryRepository.findVariantSnapshots(input.variantIds);
  }
}
