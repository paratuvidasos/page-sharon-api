import { PaginationMeta, buildPaginationMeta } from "../../../shared-kernel/infrastructure/http/pagination";
import { ProductQueryRepository } from "../../domain/repositories/ProductQueryRepository";
import { ProductRatingSummary, RatingSummaryPort } from "../ports/RatingSummaryPort";
import { ListProductsResultItem } from "./ListProducts";

export interface SearchProductsInput {
  term: string;
  page: number;
  limit: number;
}

export interface SearchProductsResult {
  items: ListProductsResultItem[];
  meta: PaginationMeta;
}

const NO_RATING: ProductRatingSummary = { average: null, count: 0 };

export class SearchProducts {
  constructor(
    private readonly productQueryRepository: ProductQueryRepository,
    private readonly ratingSummaryPort?: RatingSummaryPort,
  ) {}

  async execute(input: SearchProductsInput): Promise<SearchProductsResult> {
    const { items, total } = await this.productQueryRepository.searchByKeyword(input.term, {
      page: input.page,
      limit: input.limit,
    });

    const ratings =
      items.length > 0 && this.ratingSummaryPort
        ? await this.ratingSummaryPort.execute({ productIds: items.map((item) => item.id) })
        : new Map<string, ProductRatingSummary>();

    return {
      items: items.map((item) => ({ ...item, rating: ratings.get(item.id) ?? NO_RATING })),
      meta: buildPaginationMeta(input.page, input.limit, total),
    };
  }
}
