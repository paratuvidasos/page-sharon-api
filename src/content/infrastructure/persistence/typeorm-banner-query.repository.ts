import { DataSource, Repository } from "typeorm";
import { BannerPlacement } from "../../domain/enums/BannerPlacement";
import { BannerListItem, BannerQueryRepository } from "../../domain/repositories/BannerQueryRepository";
import { BannerOrmEntity } from "./entities/BannerOrmEntity";

export class TypeOrmBannerQueryRepository implements BannerQueryRepository {
  private readonly ormRepository: Repository<BannerOrmEntity>;

  constructor(dataSource: DataSource) {
    this.ormRepository = dataSource.getRepository(BannerOrmEntity);
  }

  async listForAdmin(): Promise<BannerListItem[]> {
    const rows = await this.ormRepository.find({ order: { sortOrder: "ASC" } });
    return rows.map(toListItem);
  }

  async listActiveForHomepage(now: Date, placement?: BannerPlacement): Promise<BannerListItem[]> {
    const query = this.ormRepository
      .createQueryBuilder("banner")
      .where("banner.isActive = true")
      .andWhere("(banner.startsAt IS NULL OR banner.startsAt <= :now)", { now })
      .andWhere("(banner.endsAt IS NULL OR banner.endsAt >= :now)", { now });

    if (placement) {
      query.andWhere(":placement = ANY(banner.placements)", { placement });
    }

    const rows = await query.orderBy("banner.sortOrder", "ASC").getMany();

    return rows.map(toListItem);
  }
}

function toListItem(row: BannerOrmEntity): BannerListItem {
  return {
    id: row.id,
    imageUrl: row.imageUrl,
    linkUrl: row.linkUrl,
    title: row.title,
    sortOrder: row.sortOrder,
    startsAt: row.startsAt,
    endsAt: row.endsAt,
    isActive: row.isActive,
    category: row.category,
    actionType: row.actionType,
    placements: row.placements,
  };
}
