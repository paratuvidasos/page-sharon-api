import { generateId } from "../../../shared-kernel/infrastructure/ids/generate-id";
import { Category } from "../../domain/entities/Category";
import { CategorySlugAlreadyExistsException } from "../../domain/exceptions/CategorySlugAlreadyExistsException";
import { CategoryRepository } from "../../domain/repositories/CategoryRepository";

export interface CreateCategoryInput {
  name: string;
  slug: string;
  parentId?: string | null;
}

/** [0058]: alta de una categoría desde el panel administrativo. */
export class CreateCategory {
  constructor(private readonly categoryRepository: CategoryRepository) {}

  async execute(input: CreateCategoryInput): Promise<{ id: string }> {
    const existing = await this.categoryRepository.findBySlug(input.slug.trim().toLowerCase());
    if (existing) {
      throw new CategorySlugAlreadyExistsException(input.slug);
    }

    const category = Category.create({ id: generateId(), ...input });
    await this.categoryRepository.save(category);
    return { id: category.id };
  }
}
