import { DataSource, Repository } from "typeorm";
import { Product } from "../../domain/entities/Product";
import { ProductNotFoundException } from "../../domain/exceptions/ProductNotFoundException";
import { ProductRepository, ProductSaleItem } from "../../domain/repositories/ProductRepository";
import { ProductOrmEntity } from "./entities/ProductOrmEntity";
import { ProductMapper } from "./mappers/ProductMapper";

export class TypeOrmProductRepository implements ProductRepository {
  private readonly ormRepository: Repository<ProductOrmEntity>;

  constructor(dataSource: DataSource) {
    this.ormRepository = dataSource.getRepository(ProductOrmEntity);
  }

  async save(product: Product): Promise<void> {
    const orm = ProductMapper.toOrm(product);
    await this.ormRepository.save(orm);
  }

  async findById(id: string): Promise<Product | null> {
    const orm = await this.ormRepository.findOne({ where: { id }, relations: { variants: true } });
    return orm ? ProductMapper.toDomain(orm) : null;
  }

  async findBySlug(slug: string): Promise<Product | null> {
    const orm = await this.ormRepository.findOne({ where: { slug }, relations: { variants: true } });
    return orm ? ProductMapper.toDomain(orm) : null;
  }

  async incrementSalesCounts(items: ProductSaleItem[]): Promise<void> {
    for (const item of items) {
      await this.ormRepository.increment({ id: item.productId }, "salesCount", item.quantity);
    }
  }

  async setFeatured(productId: string, isFeatured: boolean): Promise<void> {
    const result = await this.ormRepository.update({ id: productId }, { isFeatured });
    if (result.affected === 0) {
      throw new ProductNotFoundException();
    }
  }
}
