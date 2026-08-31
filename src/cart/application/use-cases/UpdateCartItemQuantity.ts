import { Locale } from "../../../shared-kernel/domain/enums/Locale";
import { CartItemNotFoundException } from "../../domain/exceptions/CartItemNotFoundException";
import { InsufficientStockException } from "../../domain/exceptions/InsufficientStockException";
import { CartRepository } from "../../domain/repositories/CartRepository";
import { CouponRepository } from "../../domain/repositories/CouponRepository";
import { buildCartResponse, CartResponse } from "../build-cart-response";
import { CartOwner, findCartByOwner } from "../cart-owner";
import { CatalogSnapshotPort } from "../ports/CatalogSnapshotPort";

export interface UpdateCartItemQuantityInput {
  owner: CartOwner;
  itemId: string;
  quantity: number;
  locale?: Locale;
}

export class UpdateCartItemQuantity {
  constructor(
    private readonly cartRepository: CartRepository,
    private readonly catalogSnapshotPort: CatalogSnapshotPort,
    private readonly couponRepository: CouponRepository,
  ) {}

  async execute(input: UpdateCartItemQuantityInput): Promise<CartResponse> {
    const cart = await findCartByOwner(this.cartRepository, input.owner);
    if (!cart) {
      throw new CartItemNotFoundException();
    }

    const item = cart.items.find((current) => current.id === input.itemId);
    if (!item) {
      throw new CartItemNotFoundException();
    }

    const [snapshot] = await this.catalogSnapshotPort.execute({ variantIds: [item.variantId], locale: input.locale });
    if (snapshot && input.quantity > snapshot.stockQuantity) {
      throw new InsufficientStockException(snapshot.stockQuantity);
    }

    cart.updateItemQuantity(input.itemId, input.quantity);
    await this.cartRepository.save(cart);

    const { response } = await buildCartResponse(cart, this.catalogSnapshotPort, this.couponRepository, input.locale);
    return response;
  }
}
