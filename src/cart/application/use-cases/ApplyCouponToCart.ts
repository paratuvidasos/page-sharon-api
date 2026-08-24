import { CouponNotFoundException } from "../../domain/exceptions/CouponNotFoundException";
import { CartRepository } from "../../domain/repositories/CartRepository";
import { CouponRepository } from "../../domain/repositories/CouponRepository";
import { buildCartResponse, CartResponse } from "../build-cart-response";
import { computeCartTotals } from "../cart-pricing";
import { CartOwner, getOrCreateCartByOwner } from "../cart-owner";
import { CatalogSnapshotPort } from "../ports/CatalogSnapshotPort";

export interface ApplyCouponToCartInput {
  owner: CartOwner;
  code: string;
}

/**
 * Cupón simple sobre el carrito completo (sin alcance por producto/categoría
 * — decisión tomada en la planificación de [0027]).
 */
export class ApplyCouponToCart {
  constructor(
    private readonly cartRepository: CartRepository,
    private readonly couponRepository: CouponRepository,
    private readonly catalogSnapshotPort: CatalogSnapshotPort,
  ) {}

  async execute(input: ApplyCouponToCartInput): Promise<CartResponse> {
    const coupon = await this.couponRepository.findByCode(input.code.toUpperCase());
    if (!coupon) {
      throw new CouponNotFoundException();
    }

    const cart = await getOrCreateCartByOwner(this.cartRepository, input.owner);
    const { response: currentResponse } = await buildCartResponse(
      cart,
      this.catalogSnapshotPort,
      this.couponRepository,
    );
    const { subtotal } = computeCartTotals(currentResponse.items, null);

    coupon.assertApplicable(subtotal, new Date());

    cart.applyCoupon(coupon.code);
    await this.cartRepository.save(cart);

    const { response } = await buildCartResponse(cart, this.catalogSnapshotPort, this.couponRepository);
    return response;
  }
}
