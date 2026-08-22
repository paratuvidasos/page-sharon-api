import { DataSource, Repository } from "typeorm";
import {
  CategoryListPage,
  CategoryListPagination,
  CategoryQueryRepository,
} from "../../domain/repositories/CategoryQueryRepository";
import { CategoryOrmEntity } from "./entities/CategoryOrmEntity";

export class TypeOrmCategoryQueryRepository implements CategoryQueryRepository {
  private readonly ormRepository: Repository<CategoryOrmEntity>;

  constructor(dataSource: DataSource) {
    this.ormRepository = dataSource.getRepository(CategoryOrmEntity);
  }

  async listAll(pagination: CategoryListPagination): Promise<CategoryListPage> {
    const [rows, total] = await this.ormRepository
      .createQueryBuilder("category")
      .orderBy("category.name", "ASC")
      .skip((pagination.page - 1) * pagination.limit)
      .take(pagination.limit)
      .getManyAndCount();

    return {
      items: rows.map((row) => ({ id: row.id, name: row.name, slug: row.slug, parentId: row.parentId })),
      total,
    };
  }
}
