export interface WishlistPagination {
  page: number;
  limit: number;
}

export interface WishlistListItem {
  productId: string;
  addedAt: Date;
}

export interface WishlistPage {
  items: WishlistListItem[];
  total: number;
}

/**
 * Read model de solo lectura para la wishlist — devuelve DTOs planos en vez
 * del agregado `WishlistItem` (ver sección "Queries" del CLAUDE.md del
 * repo).
 */
export interface WishlistQueryRepository {
  listForUser(userId: string, pagination: WishlistPagination): Promise<WishlistPage>;

  /**
   * Dado un conjunto acotado de productIds (p. ej. los que están
   * renderizados en una página de listado), devuelve cuáles de ellos están
   * en la wishlist del usuario. Deliberadamente no existe un método que
   * devuelva TODOS los productIds de la wishlist sin límite (ver regla de
   * paginación del CLAUDE.md del repo).
   */
  findWishlistedProductIds(userId: string, productIds: string[]): Promise<string[]>;
}
