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
 * Solo lectura: no hay ningún caso de uso de creación/edición de categorías
 * en el backlog [0013]-[0022] (eso es CRUD de admin, fuera de alcance), así
 * que no existe un `CategoryRepository` de escritura — solo este read model
 * (ver sección "Queries" del CLAUDE.md del repo).
 */
export interface CategoryQueryRepository {
  listAll(pagination: CategoryListPagination): Promise<CategoryListPage>;
}
