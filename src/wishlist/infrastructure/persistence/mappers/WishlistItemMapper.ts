import { WishlistItem } from "../../../domain/entities/WishlistItem";
import { WishlistItemOrmEntity } from "../entities/WishlistItemOrmEntity";

export class WishlistItemMapper {
  static toOrm(item: WishlistItem): WishlistItemOrmEntity {
    const props = item.toProps();

    const orm = new WishlistItemOrmEntity();
    orm.id = props.id;
    orm.userId = props.userId;
    orm.productId = props.productId;
    orm.addedAt = props.addedAt;
    return orm;
  }

  static toDomain(orm: WishlistItemOrmEntity): WishlistItem {
    return WishlistItem.reconstitute({
      id: orm.id,
      userId: orm.userId,
      productId: orm.productId,
      addedAt: orm.addedAt,
    });
  }
}
