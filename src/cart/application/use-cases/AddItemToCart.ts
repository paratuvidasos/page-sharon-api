import { CartRepository } from "../../domain/repositories/CartRepository";
import { CouponRepository } from "../../domain/repositories/CouponRepository";
import { CartProductUnavailableException } from "../../domain/exceptions/CartProductUnavailableException";
import { InsufficientStockException } from "../../domain/exceptions/InsufficientStockException";
import { generateId } from "../../../shared-kernel/infrastructure/ids/generate-id";
import { Locale } from "../../../shared-kernel/domain/enums/Locale";
import { buildCartResponse, CartResponse } from "../build-cart-response";
import { CartOwner, getOrCreateCartByOwner } from "../cart-owner";
import { CatalogSnapshotPort } from "../ports/CatalogSnapshotPort";

export interface AddItemToCartInput {
  owner: CartOwner;
  variantId: string;
  quantity: number;
  locale?: Locale;
}

export class AddItemToCart {
  constructor(
    private readonly cartRepository: CartRepository,
    private readonly catalogSnapshotPort: CatalogSnapshotPort,
    private readonly couponRepository: CouponRepository,
  ) {}

  async execute(input: AddItemToCartInput): Promise<CartResponse> {
    const [snapshot] = await this.catalogSnapshotPort.execute({ variantIds: [input.variantId], locale: input.locale });
    if (!snapshot || !snapshot.isActive) {
      throw new CartProductUnavailableException();
    }

    const cart = await getOrCreateCartByOwner(this.cartRepository, input.owner);
    const existingItem = cart.items.find((item) => item.variantId === input.variantId);
    const requestedTotal = (existingItem?.quantity ?? 0) + input.quantity;

    if (requestedTotal > snapshot.stockQuantity) {
      throw new InsufficientStockException(snapshot.stockQuantity);
    }

    cart.addItem({
      id: generateId(),
      productId: snapshot.productId,
      variantId: input.variantId,
      quantity: input.quantity,
      unitPrice: snapshot.unitPrice,
    });

    await this.cartRepository.save(cart);
    const { response } = await buildCartResponse(cart, this.catalogSnapshotPort, this.couponRepository, input.locale);
    return response;
  }
}
