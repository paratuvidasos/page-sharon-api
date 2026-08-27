import { PaginationMeta, buildPaginationMeta } from "../../../shared-kernel/infrastructure/http/pagination";
import { InventorySort } from "../../domain/enums/InventorySort";
import { LowStockVariantItem, ProductQueryRepository } from "../../domain/repositories/ProductQueryRepository";

export interface ListInventoryInput {
  page: number;
  limit: number;
  search?: string;
  categoryId?: string;
  onlyLowStock?: boolean;
  sort?: InventorySort;
}

export interface ListInventoryResult {
  items: LowStockVariantItem[];
  meta: PaginationMeta;
}

/**
 * [0059]: inventario general — todas las variantes con su stock, filtrable
 * y ordenable, para "ver y editar el stock de cada producto y variante"
 * (AC). Distinto de `ListLowStockVariants`, que es solo el subconjunto en
 * alerta y siempre viene ordenado por urgencia.
 */
export class ListInventory {
  constructor(private readonly productQueryRepository: ProductQueryRepository) {}

  async execute(input: ListInventoryInput): Promise<ListInventoryResult> {
    const { items, total } = await this.productQueryRepository.listAllVariants(
      {
        search: input.search,
        categoryId: input.categoryId,
        onlyLowStock: input.onlyLowStock,
        sort: input.sort,
      },
      { page: input.page, limit: input.limit },
    );

    return { items, meta: buildPaginationMeta(input.page, input.limit, total) };
  }
}
