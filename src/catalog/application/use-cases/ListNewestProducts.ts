import { ProductListItem, ProductQueryRepository } from "../../domain/repositories/ProductQueryRepository";

/** [0066]: puerto que `content` consume para la regla automática "novedades" de destacados de home. */
export class ListNewestProducts {
  constructor(private readonly productQueryRepository: ProductQueryRepository) {}

  async execute(input: { limit: number }): Promise<ProductListItem[]> {
    return this.productQueryRepository.listNewest(input.limit);
  }
}
