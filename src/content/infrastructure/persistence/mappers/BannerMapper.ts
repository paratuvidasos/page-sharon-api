import { Banner } from "../../../domain/entities/Banner";
import { BannerOrmEntity } from "../entities/BannerOrmEntity";

export class BannerMapper {
  static toOrm(banner: Banner): BannerOrmEntity {
    const props = banner.toProps();

    const orm = new BannerOrmEntity();
    orm.id = props.id;
    orm.imageUrl = props.imageUrl;
    orm.linkUrl = props.linkUrl;
    orm.title = props.title;
    orm.sortOrder = props.sortOrder;
    orm.startsAt = props.startsAt;
    orm.endsAt = props.endsAt;
    orm.isActive = props.isActive;
    orm.category = props.category;
    orm.actionType = props.actionType;
    orm.placements = props.placements;
    orm.createdAt = props.createdAt;
    return orm;
  }

  static toDomain(orm: BannerOrmEntity): Banner {
    return Banner.reconstitute({
      id: orm.id,
      imageUrl: orm.imageUrl,
      linkUrl: orm.linkUrl,
      title: orm.title,
      sortOrder: orm.sortOrder,
      startsAt: orm.startsAt,
      endsAt: orm.endsAt,
      isActive: orm.isActive,
      category: orm.category,
      actionType: orm.actionType,
      placements: orm.placements,
      createdAt: orm.createdAt,
    });
  }
}
