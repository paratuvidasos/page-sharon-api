export interface WishlistItemProps {
  id: string;
  userId: string;
  productId: string;
  addedAt: Date;
}

export interface AddWishlistItemInput {
  id: string;
  userId: string;
  productId: string;
}

export class WishlistItem {
  private constructor(private props: WishlistItemProps) {}

  static create(input: AddWishlistItemInput): WishlistItem {
    return new WishlistItem({
      id: input.id,
      userId: input.userId,
      productId: input.productId,
      addedAt: new Date(),
    });
  }

  static reconstitute(props: WishlistItemProps): WishlistItem {
    return new WishlistItem(props);
  }

  get id(): string {
    return this.props.id;
  }

  toProps(): WishlistItemProps {
    return { ...this.props };
  }
}
