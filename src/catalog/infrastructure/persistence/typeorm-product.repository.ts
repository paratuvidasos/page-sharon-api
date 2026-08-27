import { DataSource, Repository } from "typeorm";
import { Product } from "../../domain/entities/Product";
import { ProductNotFoundException } from "../../domain/exceptions/ProductNotFoundException";
import { VariantNotFoundException } from "../../domain/exceptions/VariantNotFoundException";
import { ProductRepository, ProductSaleItem } from "../../domain/repositories/ProductRepository";
import { ProductOrmEntity } from "./entities/ProductOrmEntity";
import { ProductVariantOrmEntity } from "./entities/ProductVariantOrmEntity";
import { ProductMapper } from "./mappers/ProductMapper";

export class TypeOrmProductRepository implements ProductRepository {
  private readonly ormRepository: Repository<ProductOrmEntity>;
  private readonly variantOrmRepository: Repository<ProductVariantOrmEntity>;

  constructor(dataSource: DataSource) {
    this.ormRepository = dataSource.getRepository(ProductOrmEntity);
    this.variantOrmRepository = dataSource.getRepository(ProductVariantOrmEntity);
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

  async delete(id: string): Promise<void> {
    await this.ormRepository.delete({ id });
  }

  async existsVariantWithSku(sku: string, excludeVariantId?: string): Promise<boolean> {
    const query = this.variantOrmRepository
      .createQueryBuilder("variant")
      .where("variant.sku = :sku", { sku });

    if (excludeVariantId) {
      query.andWhere("variant.id != :excludeVariantId", { excludeVariantId });
    }

    const count = await query.getCount();
    return count > 0;
  }

  async setVariantStock(variantId: string, quantity: number): Promise<void> {
    const result = await this.variantOrmRepository.update({ id: variantId }, { stockQuantity: quantity });
    if (result.affected === 0) {
      throw new VariantNotFoundException();
    }
  }

  async setVariantLowStockThreshold(variantId: string, threshold: number | null): Promise<void> {
    const result = await this.variantOrmRepository.update(
      { id: variantId },
      { lowStockThreshold: threshold },
    );
    if (result.affected === 0) {
      throw new VariantNotFoundException();
    }
  }
}
