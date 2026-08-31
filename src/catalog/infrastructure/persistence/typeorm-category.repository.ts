import { DataSource, Repository } from "typeorm";
import { Category } from "../../domain/entities/Category";
import { CategoryRepository } from "../../domain/repositories/CategoryRepository";
import { CategoryOrmEntity } from "./entities/CategoryOrmEntity";
import { CategoryMapper } from "./mappers/CategoryMapper";

export class TypeOrmCategoryRepository implements CategoryRepository {
  private readonly ormRepository: Repository<CategoryOrmEntity>;

  constructor(dataSource: DataSource) {
    this.ormRepository = dataSource.getRepository(CategoryOrmEntity);
  }

  async save(category: Category): Promise<void> {
    await this.ormRepository.save(CategoryMapper.toOrm(category));
  }

  async findById(id: string): Promise<Category | null> {
    const orm = await this.ormRepository.findOne({ where: { id } });
    return orm ? CategoryMapper.toDomain(orm) : null;
  }

  async findBySlug(slug: string): Promise<Category | null> {
    const orm = await this.ormRepository.findOne({ where: { slug } });
    return orm ? CategoryMapper.toDomain(orm) : null;
  }

  async delete(id: string): Promise<void> {
    await this.ormRepository.delete({ id });
  }
}
