import { Locale } from "../../../shared-kernel/domain/enums/Locale";
import { ProductNotFoundException } from "../../domain/exceptions/ProductNotFoundException";
import { ProductQueryRepository } from "../../domain/repositories/ProductQueryRepository";
import { ProductRepository } from "../../domain/repositories/ProductRepository";
import { ProductRatingSummary, RatingSummaryPort } from "../ports/RatingSummaryPort";
import { ListProductsResultItem } from "./ListProducts";

export interface ListRelatedProductsInput {
  slug: string;
  limit?: number;
  locale: Locale;
}

const DEFAULT_RELATED_LIMIT = 8;
const NO_RATING: ProductRatingSummary = { average: null, count: 0 };

/**
 * [0020]: recomendaciones de la misma categoría, sin co-compra (decisión
 * tomada con el usuario para no requerir analítica de "comprados juntos"
 * sobre order_items en esta tanda).
 */
export class ListRelatedProducts {
  constructor(
    private readonly productRepository: ProductRepository,
    private readonly productQueryRepository: ProductQueryRepository,
    private readonly ratingSummaryPort?: RatingSummaryPort,
  ) {}

  async execute(input: ListRelatedProductsInput): Promise<ListProductsResultItem[]> {
    const product = await this.productRepository.findBySlug(input.slug);
    if (!product) {
      throw new ProductNotFoundException();
    }

    const props = product.toProps();
    const items = await this.productQueryRepository.findRelatedProducts(
      {
        productId: props.id,
        categoryId: props.categoryId,
        limit: input.limit ?? DEFAULT_RELATED_LIMIT,
      },
      input.locale,
    );

    const ratings =
      items.length > 0 && this.ratingSummaryPort
        ? await this.ratingSummaryPort.execute({ productIds: items.map((item) => item.id) })
        : new Map<string, ProductRatingSummary>();

    return items.map((item) => ({ ...item, rating: ratings.get(item.id) ?? NO_RATING }));
  }
}
