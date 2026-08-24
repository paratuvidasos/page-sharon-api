import { DataSource, Repository, SelectQueryBuilder } from "typeorm";
import { ProductSort } from "../../domain/enums/ProductSort";
import { ProductStatus } from "../../domain/enums/ProductStatus";
import { computeStockStatus } from "../../domain/enums/StockStatus";
import {
  ProductFacetOption,
  ProductFilterFacets,
  ProductFilterFacetsFilter,
  ProductListFilter,
  ProductListItem,
  ProductListPage,
  ProductListPagination,
  ProductQueryRepository,
  ProductSuggestion,
  RelatedProductsFilter,
} from "../../domain/repositories/ProductQueryRepository";
import { ProductOrmEntity } from "./entities/ProductOrmEntity";
import { ProductVariantOrmEntity } from "./entities/ProductVariantOrmEntity";

const ATTRIBUTE_KEYS = ["hairType", "line", "mainIngredient"] as const;

export class TypeOrmProductQueryRepository implements ProductQueryRepository {
  private readonly productOrmRepository: Repository<ProductOrmEntity>;
  private readonly variantOrmRepository: Repository<ProductVariantOrmEntity>;

  constructor(dataSource: DataSource) {
    this.productOrmRepository = dataSource.getRepository(ProductOrmEntity);
    this.variantOrmRepository = dataSource.getRepository(ProductVariantOrmEntity);
  }

  async listForCatalogPage(
    filter: ProductListFilter,
    pagination: ProductListPagination,
  ): Promise<ProductListPage> {
    const qb = this.baseQuery({ status: filter.status, categoryId: filter.categoryId });

    if (filter.attributes?.hairType) {
      qb.andWhere("product.attributes ->> 'hairType' = :hairType", { hairType: filter.attributes.hairType });
    }
    if (filter.attributes?.line) {
      qb.andWhere("product.attributes ->> 'line' = :line", { line: filter.attributes.line });
    }
    if (filter.attributes?.mainIngredient) {
      qb.andWhere("product.attributes ->> 'mainIngredient' = :mainIngredient", {
        mainIngredient: filter.attributes.mainIngredient,
      });
    }
    if (filter.priceMin != null) {
      qb.andWhere("product.basePrice >= :priceMin", { priceMin: filter.priceMin });
    }
    if (filter.priceMax != null) {
      qb.andWhere("product.basePrice <= :priceMax", { priceMax: filter.priceMax });
    }

    this.applySort(qb, filter.sort);

    const [products, total] = await qb
      .skip((pagination.page - 1) * pagination.limit)
      .take(pagination.limit)
      .getManyAndCount();

    if (products.length === 0) {
      return { items: [], total };
    }

    // Consulta separada del stock agregado por producto en vez de un join
    // uno-a-muchos sobre la página ya paginada: TypeORM no garantiza
    // skip/take correctos sobre el agregado raíz cuando el query builder
    // trae relaciones "to-many" en la misma consulta.
    const maxStockByProductId = await this.getMaxStockByProductId(products.map((product) => product.id));

    return {
      items: products.map((product) =>
        this.toListItem(product, maxStockByProductId.get(product.id) ?? 0),
      ),
      total,
    };
  }

  async getAvailableFilters(filter: ProductFilterFacetsFilter): Promise<ProductFilterFacets> {
    const [hairType, line, mainIngredient, priceRange] = await Promise.all([
      this.countByAttribute("hairType", filter),
      this.countByAttribute("line", filter),
      this.countByAttribute("mainIngredient", filter),
      this.baseQuery(filter)
        .select("MIN(product.basePrice)", "min")
        .addSelect("MAX(product.basePrice)", "max")
        .getRawOne<{ min: string | null; max: string | null }>(),
    ]);

    return {
      hairType,
      line,
      mainIngredient,
      priceRange: { min: Number(priceRange?.min ?? 0), max: Number(priceRange?.max ?? 0) },
    };
  }

  async searchByKeyword(term: string, pagination: ProductListPagination): Promise<ProductListPage> {
    const qb = this.productOrmRepository
      .createQueryBuilder("product")
      .leftJoin("categories", "category", "category.id = product.categoryId")
      .where("product.status = :status", { status: ProductStatus.ACTIVE })
      .andWhere("(product.search_vector @@ plainto_tsquery('spanish', :term) OR category.name ILIKE :likeTerm)", {
        term,
        likeTerm: `%${term}%`,
      })
      // Seleccionado como columna aparte (alias "rank") en vez de pasar la
      // expresión cruda a .orderBy(): combinado con getManyAndCount(),
      // TypeORM intenta parsear el string de orderBy como "alias.columna" y
      // rompe con cualquier función SQL que tenga un punto/paréntesis
      // (ver https://github.com/typeorm/typeorm/issues — "alias was not
      // found" con expresiones crudas en orderBy + entidades híbridas).
      .addSelect("ts_rank(product.search_vector, plainto_tsquery('spanish', :term))", "rank")
      .setParameter("term", term);

    const [products, total] = await qb
      .orderBy("rank", "DESC")
      .addOrderBy("product.createdAt", "DESC")
      .skip((pagination.page - 1) * pagination.limit)
      .take(pagination.limit)
      .getManyAndCount();

    if (products.length === 0) {
      return { items: [], total };
    }

    const maxStockByProductId = await this.getMaxStockByProductId(products.map((product) => product.id));

    return {
      items: products.map((product) => this.toListItem(product, maxStockByProductId.get(product.id) ?? 0)),
      total,
    };
  }

  async suggestByPrefix(prefix: string, limit: number): Promise<ProductSuggestion[]> {
    const rows = await this.productOrmRepository
      .createQueryBuilder("product")
      .where("product.status = :status", { status: ProductStatus.ACTIVE })
      .andWhere("lower(product.name) LIKE :prefix", { prefix: `${prefix.toLowerCase()}%` })
      .orderBy("product.name", "ASC")
      .take(limit)
      .getMany();

    return rows.map((product) => ({
      id: product.id,
      slug: product.slug,
      name: product.name,
      thumbnailUrl: product.images[0] ?? null,
    }));
  }

  async findRelatedProducts(filter: RelatedProductsFilter): Promise<ProductListItem[]> {
    const products = await this.productOrmRepository
      .createQueryBuilder("product")
      .where("product.status = :status", { status: ProductStatus.ACTIVE })
      .andWhere("product.categoryId = :categoryId", { categoryId: filter.categoryId })
      .andWhere("product.id != :productId", { productId: filter.productId })
      .andWhere(
        "EXISTS (SELECT 1 FROM product_variants v WHERE v.product_id = product.id AND v.stock_quantity > 0)",
      )
      .orderBy("product.salesCount", "DESC")
      .addOrderBy("product.createdAt", "DESC")
      .take(filter.limit)
      .getMany();

    if (products.length === 0) {
      return [];
    }

    const maxStockByProductId = await this.getMaxStockByProductId(products.map((product) => product.id));

    return products.map((product) => this.toListItem(product, maxStockByProductId.get(product.id) ?? 0));
  }

  async listFeaturedAndOnSale(limit: number): Promise<ProductListItem[]> {
    const products = await this.productOrmRepository
      .createQueryBuilder("product")
      .where("product.status = :status", { status: ProductStatus.ACTIVE })
      .andWhere("(product.isFeatured = true OR product.compareAtPrice IS NOT NULL)")
      .orderBy("product.isFeatured", "DESC")
      .addOrderBy("product.createdAt", "DESC")
      .take(limit)
      .getMany();

    if (products.length === 0) {
      return [];
    }

    const maxStockByProductId = await this.getMaxStockByProductId(products.map((product) => product.id));

    return products.map((product) => this.toListItem(product, maxStockByProductId.get(product.id) ?? 0));
  }

  private applySort(qb: SelectQueryBuilder<ProductOrmEntity>, sort: ProductSort | undefined): void {
    switch (sort) {
      case ProductSort.PRICE_ASC:
        qb.orderBy("product.basePrice", "ASC");
        break;
      case ProductSort.PRICE_DESC:
        qb.orderBy("product.basePrice", "DESC");
        break;
      case ProductSort.BEST_SELLING:
        qb.orderBy("product.salesCount", "DESC");
        break;
      case ProductSort.NEWEST:
      default:
        qb.orderBy("product.createdAt", "DESC");
        return;
    }
    // Desempate estable para que la paginación no repita/salte productos
    // cuando varios comparten el mismo precio o sales_count.
    qb.addOrderBy("product.createdAt", "DESC");
  }

  private baseQuery(filter: {
    status: ProductListFilter["status"];
    categoryId?: string;
  }): SelectQueryBuilder<ProductOrmEntity> {
    const qb = this.productOrmRepository
      .createQueryBuilder("product")
      .where("product.status = :status", { status: filter.status });

    if (filter.categoryId) {
      qb.andWhere("product.categoryId = :categoryId", { categoryId: filter.categoryId });
    }

    return qb;
  }

  private async countByAttribute(
    key: (typeof ATTRIBUTE_KEYS)[number],
    filter: ProductFilterFacetsFilter,
  ): Promise<ProductFacetOption[]> {
    const rows = await this.baseQuery(filter)
      .select(`product.attributes ->> '${key}'`, "value")
      .addSelect("COUNT(*)", "count")
      .andWhere(`product.attributes ->> '${key}' IS NOT NULL`)
      .groupBy("value")
      .getRawMany<{ value: string; count: string }>();

    return rows.map((row) => ({ value: row.value, count: Number(row.count) }));
  }

  private async getMaxStockByProductId(productIds: string[]): Promise<Map<string, number>> {
    const rows = await this.variantOrmRepository
      .createQueryBuilder("variant")
      .select("variant.productId", "productId")
      .addSelect("MAX(variant.stockQuantity)", "maxStock")
      .where("variant.productId IN (:...productIds)", { productIds })
      .groupBy("variant.productId")
      .getRawMany<{ productId: string; maxStock: string }>();

    return new Map(rows.map((row) => [row.productId, Number(row.maxStock)]));
  }

  private toListItem(product: ProductOrmEntity, maxVariantStock: number): ProductListItem {
    return {
      id: product.id,
      slug: product.slug,
      name: product.name,
      thumbnailUrl: product.images[0] ?? null,
      basePrice: Number(product.basePrice),
      compareAtPrice: product.compareAtPrice != null ? Number(product.compareAtPrice) : null,
      stockStatus: computeStockStatus(maxVariantStock),
    };
  }
}
