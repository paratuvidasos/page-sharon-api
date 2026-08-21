import { WishlistItem } from "../entities/WishlistItem";

/**
 * Puerto de escritura del agregado `WishlistItem`. Se mantiene separado del
 * read model de `WishlistQueryRepository` porque no es una consulta, ver
 * sección "Repository pattern" del CLAUDE.md del repo.
 */
export interface WishlistItemRepository {
  /**
   * Agrega un producto a la wishlist del usuario. Idempotente: si el par
   * (userId, productId) ya existe, no inserta un duplicado ni lanza error
   * (agregar el mismo producto dos veces no es un caso de error para el
   * usuario). Devuelve el ítem tal como quedó persistido — si ya existía,
   * es el ítem original (con su `addedAt` original), no el que se intentó
   * insertar.
   */
  add(item: WishlistItem): Promise<WishlistItem>;

  /**
   * Quita un producto de la wishlist del usuario. Idempotente: si no estaba,
   * no hace nada.
   */
  remove(userId: string, productId: string): Promise<void>;

  /**
   * Borra todos los ítems de wishlist de un usuario. Usado al eliminar la
   * cuenta (ver [0010]) — borrado duro, no hay nada que anonimizar en un
   * ítem de wishlist.
   */
  deleteAllForUser(userId: string): Promise<void>;
}
