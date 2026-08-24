import { Cart } from "../../../domain/entities/Cart";
import { CartItem } from "../../../domain/entities/CartItem";
import { CartOrmEntity } from "../entities/CartOrmEntity";
import { CartItemOrmEntity } from "../entities/CartItemOrmEntity";

export class CartMapper {
  static toOrm(cart: Cart): CartOrmEntity {
    const props = cart.toProps();

    const orm = new CartOrmEntity();
    orm.id = props.id;
    orm.ownerType = props.ownerType;
    orm.userId = props.userId;
    orm.guestId = props.guestId;
    orm.couponCode = props.couponCode;
    orm.items = props.items.map((item) => this.itemToOrm(item, props.id));
    return orm;
  }

  static toDomain(orm: CartOrmEntity): Cart {
    return Cart.reconstitute({
      id: orm.id,
      ownerType: orm.ownerType,
      userId: orm.userId,
      guestId: orm.guestId,
      couponCode: orm.couponCode,
      items: orm.items.map((item) => this.itemToDomain(item)),
      createdAt: orm.createdAt,
      updatedAt: orm.updatedAt,
    });
  }

  private static itemToOrm(item: CartItem, cartId: string): CartItemOrmEntity {
    const props = item.toProps();

    const orm = new CartItemOrmEntity();
    orm.id = props.id;
    orm.cartId = cartId;
    orm.productId = props.productId;
    orm.variantId = props.variantId;
    orm.quantity = props.quantity;
    orm.priceAtAddition = props.priceAtAddition.toFixed(2);
    return orm;
  }

  private static itemToDomain(orm: CartItemOrmEntity): CartItem {
    return CartItem.reconstitute({
      id: orm.id,
      productId: orm.productId,
      variantId: orm.variantId,
      quantity: orm.quantity,
      priceAtAddition: Number(orm.priceAtAddition),
      addedAt: orm.addedAt,
    });
  }
}
