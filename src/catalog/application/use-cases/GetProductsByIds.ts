import { Locale } from "../../../shared-kernel/domain/enums/Locale";
import { ProductListItem, ProductQueryRepository } from "../../domain/repositories/ProductQueryRepository";

/**
 * [0066]: puerto que `content` consume para el modo `MANUAL` de destacados
 * de home — resuelve los ids que eligió el admin contra el catálogo vigente.
 */
export class GetProductsByIds {
  constructor(private readonly productQueryRepository: ProductQueryRepository) {}

  async execute(input: { productIds: string[]; locale: Locale }): Promise<ProductListItem[]> {
    return this.productQueryRepository.findByIds(input.productIds, input.locale);
  }
}
