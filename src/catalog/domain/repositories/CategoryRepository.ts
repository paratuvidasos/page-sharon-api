import { Category } from "../entities/Category";

/**
 * [0058]: puerto de escritura del agregado `Category`. Separado de
 * `CategoryQueryRepository`, que es el read model de solo lectura que ya
 * consumía el catálogo público (ver "Repository pattern" del CLAUDE.md del
 * repo).
 */
export interface CategoryRepository {
  save(category: Category): Promise<void>;

  findById(id: string): Promise<Category | null>;

  findBySlug(slug: string): Promise<Category | null>;

  delete(id: string): Promise<void>;
}
