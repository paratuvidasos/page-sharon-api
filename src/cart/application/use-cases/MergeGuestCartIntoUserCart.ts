import { CartOwnerType } from "../../domain/enums/CartOwnerType";
import { CartRepository } from "../../domain/repositories/CartRepository";
import { CouponRepository } from "../../domain/repositories/CouponRepository";
import { generateId } from "../../../shared-kernel/infrastructure/ids/generate-id";
import { Locale } from "../../../shared-kernel/domain/enums/Locale";
import { Cart } from "../../domain/entities/Cart";
import { buildCartResponse, CartResponse } from "../build-cart-response";
import { CatalogSnapshotPort } from "../ports/CatalogSnapshotPort";

export interface MergeGuestCartIntoUserCartInput {
  guestId: string;
  userId: string;
  locale?: Locale;
}

/**
 * [0028]: al iniciar sesión, fusiona el carrito de invitado (identificado
 * por la cookie `guest_cart_id`) con el carrito de la cuenta, sumando
 * cantidades por variante sin duplicar líneas, y borra el carrito de
 * invitado.
 */
export class MergeGuestCartIntoUserCart {
  constructor(
    private readonly cartRepository: CartRepository,
    private readonly catalogSnapshotPort: CatalogSnapshotPort,
    private readonly couponRepository: CouponRepository,
  ) {}

  async execute(input: MergeGuestCartIntoUserCartInput): Promise<CartResponse> {
    const guestCart = await this.cartRepository.findByGuestId(input.guestId);
    if (!guestCart || guestCart.items.length === 0) {
      const userCart = await this.cartRepository.findByUserId(input.userId);
      const { response } = await buildCartResponse(userCart, this.catalogSnapshotPort, this.couponRepository, input.locale);
      return response;
    }

    let userCart = await this.cartRepository.findByUserId(input.userId);
    if (!userCart) {
      userCart = Cart.create({
        id: generateId(),
        ownerType: CartOwnerType.USER,
        userId: input.userId,
        guestId: null,
      });
    }

    userCart.mergeFrom(guestCart);
    await this.cartRepository.save(userCart);
    await this.cartRepository.deleteByGuestId(input.guestId);

    const { response } = await buildCartResponse(userCart, this.catalogSnapshotPort, this.couponRepository, input.locale);
    return response;
  }
}
