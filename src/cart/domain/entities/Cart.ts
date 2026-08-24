import { CartItem, CreateCartItemInput } from "./CartItem";
import { CartOwnerType } from "../enums/CartOwnerType";
import { CartItemNotFoundException } from "../exceptions/CartItemNotFoundException";
import { InvalidCartQuantityException } from "../exceptions/InvalidCartQuantityException";

export interface CartProps {
  id: string;
  ownerType: CartOwnerType;
  userId: string | null;
  guestId: string | null;
  items: CartItem[];
  couponCode: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateCartInput {
  id: string;
  ownerType: CartOwnerType;
  userId: string | null;
  guestId: string | null;
}

export interface AddCartItemInput {
  id: string;
  productId: string;
  variantId: string;
  quantity: number;
  unitPrice: number;
}

export class Cart {
  private constructor(private props: CartProps) {}

  static create(input: CreateCartInput): Cart {
    const now = new Date();
    return new Cart({
      id: input.id,
      ownerType: input.ownerType,
      userId: input.userId,
      guestId: input.guestId,
      items: [],
      couponCode: null,
      createdAt: now,
      updatedAt: now,
    });
  }

  static reconstitute(props: CartProps): Cart {
    return new Cart(props);
  }

  get id(): string {
    return this.props.id;
  }

  get items(): CartItem[] {
    return this.props.items;
  }

  get couponCode(): string | null {
    return this.props.couponCode;
  }

  /** Suma a la línea existente de la misma variante, o agrega una línea nueva. */
  addItem(input: AddCartItemInput): void {
    if (input.quantity <= 0) {
      throw new InvalidCartQuantityException();
    }

    const existing = this.props.items.find((item) => item.variantId === input.variantId);
    if (existing) {
      existing.increaseQuantity(input.quantity);
    } else {
      const createInput: CreateCartItemInput = {
        id: input.id,
        productId: input.productId,
        variantId: input.variantId,
        quantity: input.quantity,
        priceAtAddition: input.unitPrice,
      };
      this.props.items.push(CartItem.create(createInput));
    }
    this.touch();
  }

  updateItemQuantity(itemId: string, quantity: number): void {
    if (quantity <= 0) {
      throw new InvalidCartQuantityException();
    }
    const item = this.findItemOrThrow(itemId);
    item.setQuantity(quantity);
    this.touch();
  }

  removeItem(itemId: string): void {
    const item = this.findItemOrThrow(itemId);
    this.props.items = this.props.items.filter((current) => current.id !== item.id);
    this.touch();
  }

  clear(): void {
    this.props.items = [];
    this.props.couponCode = null;
    this.touch();
  }

  applyCoupon(code: string): void {
    this.props.couponCode = code;
    this.touch();
  }

  removeCoupon(): void {
    this.props.couponCode = null;
    this.touch();
  }

  /** Fusiona las líneas de `other` en este carrito, sumando cantidades por variante. */
  mergeFrom(other: Cart): void {
    for (const otherItem of other.items) {
      const otherProps = otherItem.toProps();
      this.addItem({
        id: otherProps.id,
        productId: otherProps.productId,
        variantId: otherProps.variantId,
        quantity: otherProps.quantity,
        unitPrice: otherProps.priceAtAddition,
      });
    }
  }

  private findItemOrThrow(itemId: string): CartItem {
    const item = this.props.items.find((current) => current.id === itemId);
    if (!item) {
      throw new CartItemNotFoundException();
    }
    return item;
  }

  private touch(): void {
    this.props.updatedAt = new Date();
  }

  toProps(): CartProps {
    return { ...this.props, items: [...this.props.items] };
  }
}
