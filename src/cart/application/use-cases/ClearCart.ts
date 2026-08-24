import { CartRepository } from "../../domain/repositories/CartRepository";
import { CartOwner, findCartByOwner } from "../cart-owner";
import { CartResponse, EMPTY_CART_RESPONSE } from "../build-cart-response";

export class ClearCart {
  constructor(private readonly cartRepository: CartRepository) {}

  async execute(owner: CartOwner): Promise<CartResponse> {
    const cart = await findCartByOwner(this.cartRepository, owner);
    if (!cart) {
      return EMPTY_CART_RESPONSE;
    }

    cart.clear();
    await this.cartRepository.save(cart);
    return EMPTY_CART_RESPONSE;
  }
}
