import { DataSource, Repository } from "typeorm";
import { WishlistItem } from "../../domain/entities/WishlistItem";
import { WishlistItemRepository } from "../../domain/repositories/WishlistItemRepository";
import { WishlistItemOrmEntity } from "./entities/WishlistItemOrmEntity";
import { WishlistItemMapper } from "./mappers/WishlistItemMapper";

export class TypeOrmWishlistItemRepository implements WishlistItemRepository {
  private readonly ormRepository: Repository<WishlistItemOrmEntity>;

  constructor(dataSource: DataSource) {
    this.ormRepository = dataSource.getRepository(WishlistItemOrmEntity);
  }

  async add(item: WishlistItem): Promise<WishlistItem> {
    const orm = WishlistItemMapper.toOrm(item);
    await this.ormRepository
      .createQueryBuilder()
      .insert()
      .into(WishlistItemOrmEntity)
      .values(orm)
      .orIgnore()
      .execute();

    // Si el par (userId, productId) ya existía, el insert de arriba no hizo
    // nada (ver orIgnore): se relee la fila real para no devolverle al
    // caller un `addedAt` inventado que no coincide con lo persistido.
    const { userId, productId } = item.toProps();
    const persisted = await this.ormRepository.findOneByOrFail({ userId, productId });
    return WishlistItemMapper.toDomain(persisted);
  }

  async remove(userId: string, productId: string): Promise<void> {
    await this.ormRepository.delete({ userId, productId });
  }

  async deleteAllForUser(userId: string): Promise<void> {
    await this.ormRepository.delete({ userId });
  }
}
