import { RatingSummary, ReviewQueryRepository } from "../../domain/repositories/ReviewQueryRepository";

export interface GetRatingSummaryForProductsInput {
  productIds: string[];
}

/**
 * Implementa estructuralmente el `RatingSummaryPort` que `catalog` define
 * para sí mismo — se inyecta en `catalog.module.ts` sin que catalog importe
 * nada de la infraestructura de `aftersales` (ver regla 2 del CLAUDE.md del
 * repo).
 */
export class GetRatingSummaryForProducts {
  constructor(private readonly reviewQueryRepository: ReviewQueryRepository) {}

  async execute(input: GetRatingSummaryForProductsInput): Promise<Map<string, RatingSummary>> {
    if (input.productIds.length === 0) {
      return new Map();
    }
    return this.reviewQueryRepository.getRatingSummaryForProducts(input.productIds);
  }
}
