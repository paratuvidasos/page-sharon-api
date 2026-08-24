export interface CartItemProps {
  id: string;
  productId: string;
  variantId: string;
  quantity: number;
  priceAtAddition: number;
  addedAt: Date;
}

export interface CreateCartItemInput {
  id: string;
  productId: string;
  variantId: string;
  quantity: number;
  priceAtAddition: number;
}

/**
 * Entidad hija del agregado `Cart` — no tiene repositorio propio, se
 * persiste siempre junto al carrito (mismo patrón que `ProductVariant` en
 * `catalog`, ver "Repository pattern" del CLAUDE.md del repo).
 */
export class CartItem {
  private constructor(private props: CartItemProps) {}

  static create(input: CreateCartItemInput): CartItem {
    return new CartItem({ ...input, addedAt: new Date() });
  }

  static reconstitute(props: CartItemProps): CartItem {
    return new CartItem(props);
  }

  get id(): string {
    return this.props.id;
  }

  get variantId(): string {
    return this.props.variantId;
  }

  get quantity(): number {
    return this.props.quantity;
  }

  increaseQuantity(amount: number): void {
    this.props.quantity += amount;
  }

  setQuantity(quantity: number): void {
    this.props.quantity = quantity;
  }

  toProps(): CartItemProps {
    return { ...this.props };
  }
}
