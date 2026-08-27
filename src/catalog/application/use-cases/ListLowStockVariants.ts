import { PaginationMeta, buildPaginationMeta } from "../../../shared-kernel/infrastructure/http/pagination";
import { LowStockVariantItem, ProductQueryRepository } from "../../domain/repositories/ProductQueryRepository";

export interface ListLowStockVariantsResult {
  items: LowStockVariantItem[];
  meta: PaginationMeta;
}

/** [0059]: listado admin de variantes en stock bajo o agotado (pull, sin notificación push). */
export class ListLowStockVariants {
  constructor(private readonly productQueryRepository: ProductQueryRepository) {}

  async execute(input: { page: number; limit: number }): Promise<ListLowStockVariantsResult> {
    const { items, total } = await this.productQueryRepository.listLowStock({
      page: input.page,
      limit: input.limit,
    });

    return { items, meta: buildPaginationMeta(input.page, input.limit, total) };
  }
}
