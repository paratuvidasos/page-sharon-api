import { Locale } from "../../../shared-kernel/domain/enums/Locale";
import { CartRepository } from "../../domain/repositories/CartRepository";
import { CouponRepository } from "../../domain/repositories/CouponRepository";
import { buildCartResponse, CartResponse } from "../build-cart-response";
import { CartOwner, findCartByOwner } from "../cart-owner";
import { CatalogSnapshotPort } from "../ports/CatalogSnapshotPort";

export class GetCart {
  constructor(
    private readonly cartRepository: CartRepository,
    private readonly catalogSnapshotPort: CatalogSnapshotPort,
    private readonly couponRepository: CouponRepository,
  ) {}

  async execute(owner: CartOwner, locale?: Locale): Promise<CartResponse> {
    const cart = await findCartByOwner(this.cartRepository, owner);
    const { response, couponWasInvalid } = await buildCartResponse(
      cart,
      this.catalogSnapshotPort,
      this.couponRepository,
      locale,
    );

    if (cart && couponWasInvalid) {
      cart.removeCoupon();
      await this.cartRepository.save(cart);
    }

    return response;
  }
}
