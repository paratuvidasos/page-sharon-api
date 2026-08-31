import { ProductRepository, ProductSaleItem } from "../../domain/repositories/ProductRepository";

export interface RecordProductSaleInput {
  items: ProductSaleItem[];
}

/**
 * Suscriptor de `OrderPaid` (evento de `orders`, ver [0019]): mantiene el
 * contador `sales_count` de catalog sin que catalog conozca la tabla
 * `order_items` de `orders` (ver reglas 2-4 del CLAUDE.md del repo).
 */
export class RecordProductSale {
  constructor(private readonly productRepository: ProductRepository) {}

  async execute(input: RecordProductSaleInput): Promise<void> {
    await this.productRepository.incrementSalesCounts(input.items);
  }
}
