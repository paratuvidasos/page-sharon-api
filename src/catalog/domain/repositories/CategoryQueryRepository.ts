export interface CategoryListItem {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
}

export interface CategoryListPagination {
  page: number;
  limit: number;
}

export interface CategoryListPage {
  items: CategoryListItem[];
  total: number;
}

/**
 * Read model de categorías para el catálogo público. Desde [0058] también
 * existe `CategoryRepository` (puerto de escritura) para el CRUD del panel
 * administrativo — este repositorio se mantiene aparte porque sigue siendo
 * el que usa el listado público, más liviano que hidratar el agregado
 * completo (ver sección "Queries" del CLAUDE.md del repo).
 */
export interface CategoryQueryRepository {
  listAll(pagination: CategoryListPagination): Promise<CategoryListPage>;

  /**
   * [0058]: cuántos productos ACTIVE tienen esta categoría — respalda el
   * guard de `DeleteCategory` ("no se puede eliminar una categoría con
   * productos activos asociados sin reasignarlos primero").
   */
  countActiveProducts(categoryId: string): Promise<number>;
}
