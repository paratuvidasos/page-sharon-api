import { Locale } from "../../../shared-kernel/domain/enums/Locale";
import { CartItemNotFoundException } from "../../domain/exceptions/CartItemNotFoundException";
import { CartRepository } from "../../domain/repositories/CartRepository";
import { CouponRepository } from "../../domain/repositories/CouponRepository";
import { buildCartResponse, CartResponse } from "../build-cart-response";
import { CartOwner, findCartByOwner } from "../cart-owner";
import { CatalogSnapshotPort } from "../ports/CatalogSnapshotPort";

export interface RemoveCartItemInput {
  owner: CartOwner;
  itemId: string;
  locale?: Locale;
}

export class RemoveCartItem {
  constructor(
    private readonly cartRepository: CartRepository,
    private readonly catalogSnapshotPort: CatalogSnapshotPort,
    private readonly couponRepository: CouponRepository,
  ) {}

  async execute(input: RemoveCartItemInput): Promise<CartResponse> {
    const cart = await findCartByOwner(this.cartRepository, input.owner);
    if (!cart) {
      throw new CartItemNotFoundException();
    }

    cart.removeItem(input.itemId);
    await this.cartRepository.save(cart);

    const { response } = await buildCartResponse(cart, this.catalogSnapshotPort, this.couponRepository, input.locale);
    return response;
  }
}
