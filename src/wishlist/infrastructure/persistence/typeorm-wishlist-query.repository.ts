import { DataSource, In, Repository } from "typeorm";
import {
  WishlistPage,
  WishlistPagination,
  WishlistQueryRepository,
} from "../../domain/repositories/WishlistQueryRepository";
import { WishlistItemOrmEntity } from "./entities/WishlistItemOrmEntity";

export class TypeOrmWishlistQueryRepository implements WishlistQueryRepository {
  private readonly ormRepository: Repository<WishlistItemOrmEntity>;

  constructor(dataSource: DataSource) {
    this.ormRepository = dataSource.getRepository(WishlistItemOrmEntity);
  }

  async listForUser(userId: string, pagination: WishlistPagination): Promise<WishlistPage> {
    const [rows, total] = await this.ormRepository
      .createQueryBuilder("item")
      .where("item.userId = :userId", { userId })
      .orderBy("item.addedAt", "DESC")
      .skip((pagination.page - 1) * pagination.limit)
      .take(pagination.limit)
      .getManyAndCount();

    return {
      items: rows.map((row) => ({ productId: row.productId, addedAt: row.addedAt })),
      total,
    };
  }

  async findWishlistedProductIds(userId: string, productIds: string[]): Promise<string[]> {
    if (productIds.length === 0) {
      return [];
    }

    const rows = await this.ormRepository.find({
      where: { userId, productId: In(productIds) },
      select: ["productId"],
    });

    return rows.map((row) => row.productId);
  }
}
