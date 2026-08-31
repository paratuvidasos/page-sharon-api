import { CartRepository } from "../../domain/repositories/CartRepository";

export interface ClearCartForUserInput {
  userId: string;
}

/**
 * [0039]: vacía el carrito de un usuario cuando su pedido queda pagado.
 *
 * Existe aparte de `ClearCart` porque este se dispara desde un evento de
 * dominio (sin petición HTTP, sin sesión): lo único que hay a la mano es el
 * id del usuario dueño del pedido.
 */
export class ClearCartForUser {
  constructor(private readonly cartRepository: CartRepository) {}

  async execute(input: ClearCartForUserInput): Promise<void> {
    const cart = await this.cartRepository.findByUserId(input.userId);
    if (!cart) {
      return;
    }
    cart.clear();
    await this.cartRepository.save(cart);
  }
}
