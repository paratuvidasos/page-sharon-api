import { DataSource, In, Repository } from "typeorm";
import { Banner } from "../../domain/entities/Banner";
import { BannerRepository } from "../../domain/repositories/BannerRepository";
import { BannerOrmEntity } from "./entities/BannerOrmEntity";
import { BannerMapper } from "./mappers/BannerMapper";

export class TypeOrmBannerRepository implements BannerRepository {
  private readonly ormRepository: Repository<BannerOrmEntity>;

  constructor(dataSource: DataSource) {
    this.ormRepository = dataSource.getRepository(BannerOrmEntity);
  }

  async save(banner: Banner): Promise<void> {
    await this.ormRepository.save(BannerMapper.toOrm(banner));
  }

  async findById(id: string): Promise<Banner | null> {
    const orm = await this.ormRepository.findOne({ where: { id } });
    return orm ? BannerMapper.toDomain(orm) : null;
  }

  async delete(id: string): Promise<void> {
    await this.ormRepository.delete({ id });
  }

  async findByIds(ids: string[]): Promise<Banner[]> {
    if (ids.length === 0) {
      return [];
    }
    const rows = await this.ormRepository.find({ where: { id: In(ids) } });
    return rows.map((row) => BannerMapper.toDomain(row));
  }
}
