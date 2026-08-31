import { DataSource, Repository } from "typeorm";
import {
  CategoryListPage,
  CategoryListPagination,
  CategoryQueryRepository,
} from "../../domain/repositories/CategoryQueryRepository";
import { ProductStatus } from "../../domain/enums/ProductStatus";
import { CategoryOrmEntity } from "./entities/CategoryOrmEntity";
import { ProductOrmEntity } from "./entities/ProductOrmEntity";

export class TypeOrmCategoryQueryRepository implements CategoryQueryRepository {
  private readonly ormRepository: Repository<CategoryOrmEntity>;
  private readonly productOrmRepository: Repository<ProductOrmEntity>;

  constructor(dataSource: DataSource) {
    this.ormRepository = dataSource.getRepository(CategoryOrmEntity);
    this.productOrmRepository = dataSource.getRepository(ProductOrmEntity);
  }

  async countActiveProducts(categoryId: string): Promise<number> {
    return this.productOrmRepository.count({
      where: { categoryId, status: ProductStatus.ACTIVE },
    });
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
