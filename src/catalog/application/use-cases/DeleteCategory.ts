import { CategoryHasActiveProductsException } from "../../domain/exceptions/CategoryHasActiveProductsException";
import { CategoryNotFoundException } from "../../domain/exceptions/CategoryNotFoundException";
import { CategoryQueryRepository } from "../../domain/repositories/CategoryQueryRepository";
import { CategoryRepository } from "../../domain/repositories/CategoryRepository";

/**
 * [0058]: baja de una categoría. "No se puede eliminar una categoría con
 * productos activos asociados sin reasignarlos primero" (AC) — el admin
 * reasigna cada producto editando su categoría antes de reintentar.
 */
export class DeleteCategory {
  constructor(
    private readonly categoryRepository: CategoryRepository,
    private readonly categoryQueryRepository: CategoryQueryRepository,
  ) {}

  async execute(input: { categoryId: string }): Promise<void> {
    const category = await this.categoryRepository.findById(input.categoryId);
    if (!category) {
      throw new CategoryNotFoundException();
    }

    const activeProducts = await this.categoryQueryRepository.countActiveProducts(input.categoryId);
    if (activeProducts > 0) {
      throw new CategoryHasActiveProductsException();
    }

    await this.categoryRepository.delete(input.categoryId);
  }
}
