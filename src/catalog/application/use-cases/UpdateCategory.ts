import { CategoryNotFoundException } from "../../domain/exceptions/CategoryNotFoundException";
import { CategorySlugAlreadyExistsException } from "../../domain/exceptions/CategorySlugAlreadyExistsException";
import { CategoryRepository } from "../../domain/repositories/CategoryRepository";

export interface UpdateCategoryInput {
  categoryId: string;
  name?: string;
  slug?: string;
  parentId?: string | null;
}

/** [0058]: edición de una categoría desde el panel administrativo. */
export class UpdateCategory {
  constructor(private readonly categoryRepository: CategoryRepository) {}

  async execute(input: UpdateCategoryInput): Promise<void> {
    const category = await this.categoryRepository.findById(input.categoryId);
    if (!category) {
      throw new CategoryNotFoundException();
    }

    if (input.slug !== undefined) {
      const existing = await this.categoryRepository.findBySlug(input.slug.trim().toLowerCase());
      if (existing && existing.id !== category.id) {
        throw new CategorySlugAlreadyExistsException(input.slug);
      }
    }

    category.update({ name: input.name, slug: input.slug, parentId: input.parentId });
    await this.categoryRepository.save(category);
  }
}
