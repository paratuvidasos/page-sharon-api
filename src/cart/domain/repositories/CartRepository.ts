import { Cart } from "../entities/Cart";

/**
 * Puerto de escritura del agregado `Cart` (incluye sus items). Un carrito
 * es una sola fila con pocos ítems, no un listado — no aplica la separación
 * de read model de la sección "Queries" del CLAUDE.md del repo.
 */
export interface CartRepository {
  save(cart: Cart): Promise<void>;

  findById(id: string): Promise<Cart | null>;

  findByUserId(userId: string): Promise<Cart | null>;

  findByGuestId(guestId: string): Promise<Cart | null>;

  deleteByGuestId(guestId: string): Promise<void>;
}
