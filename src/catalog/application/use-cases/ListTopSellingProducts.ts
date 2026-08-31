import { Locale } from "../../../shared-kernel/domain/enums/Locale";
import { ProductListItem, ProductQueryRepository } from "../../domain/repositories/ProductQueryRepository";

/** [0066]: puerto que `content` consume para la regla automática "más vendidos" de destacados de home. */
export class ListTopSellingProducts {
  constructor(private readonly productQueryRepository: ProductQueryRepository) {}

  async execute(input: { limit: number; locale: Locale }): Promise<ProductListItem[]> {
    return this.productQueryRepository.listTopSelling(input.limit, input.locale);
  }
}
