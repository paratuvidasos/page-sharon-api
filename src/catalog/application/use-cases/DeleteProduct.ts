import { ProductStatus } from "../../domain/enums/ProductStatus";
import { ProductNotFoundException } from "../../domain/exceptions/ProductNotFoundException";
import { ProductRepository } from "../../domain/repositories/ProductRepository";
import { ProductOrderHistoryPort } from "../ports/ProductOrderHistoryPort";

/**
 * [0057]: baja de un producto. "No se puede eliminar un producto con
 * pedidos históricos asociados; se puede archivar en su lugar" (AC) — si
 * `ProductOrderHistoryPort` dice que sí tuvo pedidos reales, se archiva en
 * vez de borrar. Un producto ya archivado que se vuelve a "eliminar" es un
 * no-op silencioso (ya está fuera de la tienda).
 */
export class DeleteProduct {
  constructor(
    private readonly productRepository: ProductRepository,
    private readonly productOrderHistoryPort: ProductOrderHistoryPort,
  ) {}

  async execute(input: { productId: string }): Promise<{ archived: boolean }> {
    const product = await this.productRepository.findById(input.productId);
    if (!product) {
      throw new ProductNotFoundException();
    }

    const hasHistory = await this.productOrderHistoryPort.execute({ productId: input.productId });
    if (!hasHistory) {
      await this.productRepository.delete(input.productId);
      return { archived: false };
    }

    if (product.status !== ProductStatus.ARCHIVED) {
      product.archive();
      await this.productRepository.save(product);
    }
    return { archived: true };
  }
}
