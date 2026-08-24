import { ProductStatus } from "../../domain/enums/ProductStatus";
import { ProductFilterFacets, ProductQueryRepository } from "../../domain/repositories/ProductQueryRepository";

export interface GetProductFilterFacetsInput {
  categoryId?: string;
}

export class GetProductFilterFacets {
  constructor(private readonly productQueryRepository: ProductQueryRepository) {}

  async execute(input: GetProductFilterFacetsInput): Promise<ProductFilterFacets> {
    return this.productQueryRepository.getAvailableFilters({
      status: ProductStatus.ACTIVE,
      categoryId: input.categoryId,
    });
  }
}
