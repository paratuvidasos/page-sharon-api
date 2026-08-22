import { ProductQueryRepository } from "../../domain/repositories/ProductQueryRepository";
import { ProductRatingSummary, RatingSummaryPort } from "../ports/RatingSummaryPort";
import { ListProductsResultItem } from "./ListProducts";

const DEFAULT_FEATURED_LIMIT = 20;
const NO_RATING: ProductRatingSummary = { average: null, count: 0 };

export interface ListFeaturedProductsInput {
  limit?: number;
}

export class ListFeaturedProducts {
  constructor(
    private readonly productQueryRepository: ProductQueryRepository,
    private readonly ratingSummaryPort?: RatingSummaryPort,
  ) {}

  async execute(input: ListFeaturedProductsInput): Promise<ListProductsResultItem[]> {
    const items = await this.productQueryRepository.listFeaturedAndOnSale(
      input.limit ?? DEFAULT_FEATURED_LIMIT,
    );

    const ratings =
      items.length > 0 && this.ratingSummaryPort
        ? await this.ratingSummaryPort.execute({ productIds: items.map((item) => item.id) })
        : new Map<string, ProductRatingSummary>();

    return items.map((item) => ({ ...item, rating: ratings.get(item.id) ?? NO_RATING }));
  }
}
