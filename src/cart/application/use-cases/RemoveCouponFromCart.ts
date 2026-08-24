import { CartRepository } from "../../domain/repositories/CartRepository";
import { CouponRepository } from "../../domain/repositories/CouponRepository";
import { buildCartResponse, CartResponse, EMPTY_CART_RESPONSE } from "../build-cart-response";
import { CartOwner, findCartByOwner } from "../cart-owner";
import { CatalogSnapshotPort } from "../ports/CatalogSnapshotPort";

export class RemoveCouponFromCart {
  constructor(
    private readonly cartRepository: CartRepository,
    private readonly catalogSnapshotPort: CatalogSnapshotPort,
    private readonly couponRepository: CouponRepository,
  ) {}

  async execute(owner: CartOwner): Promise<CartResponse> {
    const cart = await findCartByOwner(this.cartRepository, owner);
    if (!cart) {
      return EMPTY_CART_RESPONSE;
    }

    cart.removeCoupon();
    await this.cartRepository.save(cart);

    const { response } = await buildCartResponse(cart, this.catalogSnapshotPort, this.couponRepository);
    return response;
  }
}
