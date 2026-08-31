import { DataSource, Repository, SelectQueryBuilder } from "typeorm";
import { DEFAULT_LOCALE, Locale } from "../../../shared-kernel/domain/enums/Locale";
import { InventorySort } from "../../domain/enums/InventorySort";
import { ProductSort } from "../../domain/enums/ProductSort";
import { ProductStatus } from "../../domain/enums/ProductStatus";
import { computeStockStatus, LOW_STOCK_THRESHOLD } from "../../domain/enums/StockStatus";
import {
  InventoryListFilter,
  LowStockVariantPage,
  ProductFacetOption,
  ProductFilterFacets,
  ProductFilterFacetsFilter,
  ProductListFilter,
  ProductListItem,
  ProductListPage,
  ProductListPagination,
  ProductQueryRepository,
  ProductSuggestion,
  ProductVariantSnapshot,
  RelatedProductsFilter,
  TranslationCoverageItem,
} from "../../domain/repositories/ProductQueryRepository";
import { ProductOrmEntity } from "./entities/ProductOrmEntity";
import { ProductTranslationOrmEntity } from "./entities/ProductTranslationOrmEntity";
import { ProductVariantOrmEntity } from "./entities/ProductVariantOrmEntity";

const ATTRIBUTE_KEYS = ["hairType", "line", "mainIngredient"] as const;

interface ProductTranslationLookup {
  name: string;
  description: string;
}

export class TypeOrmProductQueryRepository implements ProductQueryRepository {
  private readonly productOrmRepository: Repository<ProductOrmEntity>;
  private readonly variantOrmRepository: Repository<ProductVariantOrmEntity>;
  private readonly translationOrmRepository: Repository<ProductTranslationOrmEntity>;

  constructor(dataSource: DataSource) {
    this.productOrmRepository = dataSource.getRepository(ProductOrmEntity);
    this.variantOrmRepository = dataSource.getRepository(ProductVariantOrmEntity);
    this.translationOrmRepository = dataSource.getRepository(ProductTranslationOrmEntity);
  }

  /**
   * [0069]: nombre/descripción traducidos para el idioma pedido, en un solo
   * query por lote (nunca uno por producto). El español base nunca tiene
   * fila en `product_translations` (`Product.setTranslation` lo rechaza), así
   * que para `DEFAULT_LOCALE` ni siquiera se consulta.
   */
  private async translationsByProductId(
    productIds: string[],
    locale: Locale,
  ): Promise<Map<string, ProductTranslationLookup>> {
    if (locale === DEFAULT_LOCALE || productIds.length === 0) {
      return new Map();
    }

    const rows = await this.translationOrmRepository
      .createQueryBuilder("translation")
      .where("translation.productId IN (:...productIds)", { productIds })
      .andWhere("translation.locale = :locale", { locale })
      .getMany();

    return new Map(rows.map((row) => [row.productId, { name: row.name, description: row.description }]));
  }

  async listForCatalogPage(
    filter: ProductListFilter,
    pagination: ProductListPagination,
    locale: Locale,
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
    const productIds = products.map((product) => product.id);
    const [maxStockByProductId, translationsByProductId] = await Promise.all([
      this.getMaxStockByProductId(productIds),
      this.translationsByProductId(productIds, locale),
    ]);

    return {
      items: products.map((product) =>
        this.toListItem(
          product,
          maxStockByProductId.get(product.id) ?? 0,
          translationsByProductId.get(product.id),
        ),
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

  async searchByKeyword(
    term: string,
    pagination: ProductListPagination,
    locale: Locale,
  ): Promise<ProductListPage> {
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

    const productIds = products.map((product) => product.id);
    const [maxStockByProductId, translationsByProductId] = await Promise.all([
      this.getMaxStockByProductId(productIds),
      this.translationsByProductId(productIds, locale),
    ]);

    return {
      items: products.map((product) =>
        this.toListItem(product, maxStockByProductId.get(product.id) ?? 0, translationsByProductId.get(product.id)),
      ),
      total,
    };
  }

  async suggestByPrefix(prefix: string, limit: number, locale: Locale): Promise<ProductSuggestion[]> {
    const rows = await this.productOrmRepository
      .createQueryBuilder("product")
      .where("product.status = :status", { status: ProductStatus.ACTIVE })
      .andWhere("lower(product.name) LIKE :prefix", { prefix: `${prefix.toLowerCase()}%` })
      .orderBy("product.name", "ASC")
      .take(limit)
      .getMany();

    const translationsByProductId = await this.translationsByProductId(
      rows.map((product) => product.id),
      locale,
    );

    return rows.map((product) => ({
      id: product.id,
      slug: product.slug,
      name: translationsByProductId.get(product.id)?.name || product.name,
      thumbnailUrl: product.images[0] ?? null,
    }));
  }

  async findRelatedProducts(filter: RelatedProductsFilter, locale: Locale): Promise<ProductListItem[]> {
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

    const productIds = products.map((product) => product.id);
    const [maxStockByProductId, translationsByProductId] = await Promise.all([
      this.getMaxStockByProductId(productIds),
      this.translationsByProductId(productIds, locale),
    ]);

    return products.map((product) =>
      this.toListItem(product, maxStockByProductId.get(product.id) ?? 0, translationsByProductId.get(product.id)),
    );
  }

  async findByIds(productIds: string[], locale: Locale): Promise<ProductListItem[]> {
    if (productIds.length === 0) {
      return [];
    }

    const products = await this.productOrmRepository
      .createQueryBuilder("product")
      .where("product.status = :status", { status: ProductStatus.ACTIVE })
      .andWhere("product.id IN (:...productIds)", { productIds })
      .getMany();

    if (products.length === 0) {
      return [];
    }

    const foundIds = products.map((product) => product.id);
    const [maxStockByProductId, translationsByProductId] = await Promise.all([
      this.getMaxStockByProductId(foundIds),
      this.translationsByProductId(foundIds, locale),
    ]);
    const byId = new Map(
      products.map((product) => [
        product.id,
        this.toListItem(product, maxStockByProductId.get(product.id) ?? 0, translationsByProductId.get(product.id)),
      ]),
    );

    // Se respeta el orden pedido (el que definió el admin), no el de la query.
    return productIds.map((id) => byId.get(id)).filter((item): item is ProductListItem => item !== undefined);
  }

  async listTopSelling(limit: number, locale: Locale): Promise<ProductListItem[]> {
    const products = await this.productOrmRepository
      .createQueryBuilder("product")
      .where("product.status = :status", { status: ProductStatus.ACTIVE })
      .andWhere(
        "EXISTS (SELECT 1 FROM product_variants v WHERE v.product_id = product.id AND v.stock_quantity > 0)",
      )
      .orderBy("product.salesCount", "DESC")
      .addOrderBy("product.createdAt", "DESC")
      .take(limit)
      .getMany();

    if (products.length === 0) {
      return [];
    }

    const topSellingIds = products.map((product) => product.id);
    const [maxStockByProductId, translationsByProductId] = await Promise.all([
      this.getMaxStockByProductId(topSellingIds),
      this.translationsByProductId(topSellingIds, locale),
    ]);
    return products.map((product) =>
      this.toListItem(product, maxStockByProductId.get(product.id) ?? 0, translationsByProductId.get(product.id)),
    );
  }

  async listNewest(limit: number, locale: Locale): Promise<ProductListItem[]> {
    const products = await this.productOrmRepository
      .createQueryBuilder("product")
      .where("product.status = :status", { status: ProductStatus.ACTIVE })
      .andWhere(
        "EXISTS (SELECT 1 FROM product_variants v WHERE v.product_id = product.id AND v.stock_quantity > 0)",
      )
      .orderBy("product.createdAt", "DESC")
      .take(limit)
      .getMany();

    if (products.length === 0) {
      return [];
    }

    const newestIds = products.map((product) => product.id);
    const [maxStockByProductId, translationsByProductId] = await Promise.all([
      this.getMaxStockByProductId(newestIds),
      this.translationsByProductId(newestIds, locale),
    ]);
    return products.map((product) =>
      this.toListItem(product, maxStockByProductId.get(product.id) ?? 0, translationsByProductId.get(product.id)),
    );
  }

  async listFeaturedAndOnSale(limit: number, locale: Locale): Promise<ProductListItem[]> {
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

    const featuredIds = products.map((product) => product.id);
    const [maxStockByProductId, translationsByProductId] = await Promise.all([
      this.getMaxStockByProductId(featuredIds),
      this.translationsByProductId(featuredIds, locale),
    ]);

    return products.map((product) =>
      this.toListItem(product, maxStockByProductId.get(product.id) ?? 0, translationsByProductId.get(product.id)),
    );
  }

  async findVariantSnapshots(variantIds: string[], locale: Locale): Promise<ProductVariantSnapshot[]> {
    if (variantIds.length === 0) {
      return [];
    }

    const rows = await this.variantOrmRepository
      .createQueryBuilder("variant")
      .innerJoin("products", "product", "product.id = variant.productId")
      .leftJoin(
        "product_translations",
        "translation",
        "translation.product_id = product.id AND translation.locale = :locale",
        { locale },
      )
      .select("variant.id", "variantId")
      .addSelect("product.id", "productId")
      .addSelect("COALESCE(NULLIF(translation.name, ''), product.name)", "productName")
      .addSelect("variant.sku", "sku")
      .addSelect("product.status", "status")
      .addSelect("product.images", "images")
      .addSelect("variant.imageUrl", "variantImageUrl")
      .addSelect("variant.size", "size")
      .addSelect("variant.scent", "scent")
      .addSelect("variant.color", "color")
      .addSelect("COALESCE(variant.priceOverride, product.basePrice)", "unitPrice")
      .addSelect("variant.stockQuantity", "stockQuantity")
      .addSelect("variant.weightGrams", "weightGrams")
      .addSelect("variant.lengthCm", "lengthCm")
      .addSelect("variant.widthCm", "widthCm")
      .addSelect("variant.heightCm", "heightCm")
      .where("variant.id IN (:...variantIds)", { variantIds })
      .getRawMany<{
        variantId: string;
        productId: string;
        productName: string;
        sku: string;
        status: ProductStatus;
        images: string[];
        variantImageUrl: string | null;
        size: string | null;
        scent: string | null;
        color: string | null;
        unitPrice: string;
        stockQuantity: number;
        weightGrams: number;
        lengthCm: string | null;
        widthCm: string | null;
        heightCm: string | null;
      }>();

    return rows.map((row) => ({
      productId: row.productId,
      variantId: row.variantId,
      productName: row.productName,
      sku: row.sku,
      variantLabel: [row.size, row.scent, row.color].filter((part): part is string => Boolean(part)).join(", ") || null,
      thumbnailUrl: row.variantImageUrl ?? row.images?.[0] ?? null,
      unitPrice: Number(row.unitPrice),
      stockQuantity: Number(row.stockQuantity),
      isActive: row.status === ProductStatus.ACTIVE,
      weightGrams: Number(row.weightGrams),
      lengthCm: row.lengthCm != null ? Number(row.lengthCm) : null,
      widthCm: row.widthCm != null ? Number(row.widthCm) : null,
      heightCm: row.heightCm != null ? Number(row.heightCm) : null,
    }));
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

  async listLowStock(pagination: ProductListPagination): Promise<LowStockVariantPage> {
    const query = this.baseVariantInventoryQuery()
      .where("variant.stockQuantity <= COALESCE(variant.lowStockThreshold, :defaultThreshold)", {
        defaultThreshold: LOW_STOCK_THRESHOLD,
      })
      .orderBy("variant.stockQuantity", "ASC");

    return this.paginateVariantInventoryQuery(query, pagination);
  }

  /**
   * [0059]: inventario general, sin filtrar por umbral por defecto — "ver y
   * editar el stock de cada producto y variante" (AC), más amplio que la
   * alerta de stock bajo. Los filtros (búsqueda, categoría, solo-stock-bajo)
   * y el orden son para que el admin encuentre una variante puntual en un
   * catálogo grande, en vez de hojear página por página.
   */
  async listAllVariants(
    filter: InventoryListFilter,
    pagination: ProductListPagination,
  ): Promise<LowStockVariantPage> {
    const query = this.baseVariantInventoryQuery();

    if (filter.search) {
      query.andWhere("(product.name ILIKE :search OR variant.sku ILIKE :search)", {
        search: `%${filter.search}%`,
      });
    }
    if (filter.categoryId) {
      query.andWhere("product.categoryId = :categoryId", { categoryId: filter.categoryId });
    }
    if (filter.onlyLowStock) {
      query.andWhere("variant.stockQuantity <= COALESCE(variant.lowStockThreshold, :defaultThreshold)", {
        defaultThreshold: LOW_STOCK_THRESHOLD,
      });
    }

    applyInventorySort(query, filter.sort ?? InventorySort.NAME_ASC);

    return this.paginateVariantInventoryQuery(query, pagination);
  }

  private baseVariantInventoryQuery() {
    return this.variantOrmRepository
      .createQueryBuilder("variant")
      .innerJoin("products", "product", "product.id = variant.productId")
      .select("variant.id", "variantId")
      .addSelect("product.id", "productId")
      .addSelect("product.name", "productName")
      .addSelect("variant.sku", "sku")
      .addSelect("variant.size", "size")
      .addSelect("variant.scent", "scent")
      .addSelect("variant.color", "color")
      .addSelect("variant.stockQuantity", "stockQuantity")
      .addSelect("variant.lowStockThreshold", "lowStockThreshold");
  }

  private async paginateVariantInventoryQuery(
    query: SelectQueryBuilder<ProductVariantOrmEntity>,
    pagination: ProductListPagination,
  ): Promise<LowStockVariantPage> {
    query.skip((pagination.page - 1) * pagination.limit).take(pagination.limit);

    const [rows, total] = await Promise.all([
      query.getRawMany<{
        variantId: string;
        productId: string;
        productName: string;
        sku: string;
        size: string | null;
        scent: string | null;
        color: string | null;
        stockQuantity: number;
        lowStockThreshold: number | null;
      }>(),
      query.getCount(),
    ]);

    return {
      items: rows.map((row) => ({
        productId: row.productId,
        productName: row.productName,
        variantId: row.variantId,
        sku: row.sku,
        variantLabel:
          [row.size, row.scent, row.color].filter((part): part is string => Boolean(part)).join(", ") ||
          null,
        stockQuantity: Number(row.stockQuantity),
        lowStockThreshold: row.lowStockThreshold != null ? Number(row.lowStockThreshold) : null,
      })),
      total,
    };
  }

  private toListItem(
    product: ProductOrmEntity,
    maxVariantStock: number,
    translation?: ProductTranslationLookup,
  ): ProductListItem {
    return {
      id: product.id,
      slug: product.slug,
      name: translation?.name || product.name,
      thumbnailUrl: product.images[0] ?? null,
      basePrice: Number(product.basePrice),
      compareAtPrice: product.compareAtPrice != null ? Number(product.compareAtPrice) : null,
      stockStatus: computeStockStatus(maxVariantStock),
    };
  }

  async countTranslatedByLocale(locales: Locale[]): Promise<TranslationCoverageItem[]> {
    const total = await this.productOrmRepository.count({ where: { status: ProductStatus.ACTIVE } });

    const rows = await this.translationOrmRepository
      .createQueryBuilder("translation")
      .innerJoin("products", "product", "product.id = translation.productId")
      .select("translation.locale", "locale")
      .addSelect("COUNT(DISTINCT translation.productId)", "translated")
      .where("product.status = :status", { status: ProductStatus.ACTIVE })
      .andWhere("translation.locale IN (:...locales)", { locales })
      .groupBy("translation.locale")
      .getRawMany<{ locale: Locale; translated: string }>();

    const translatedByLocale = new Map(rows.map((row) => [row.locale, Number(row.translated)]));

    return locales.map((locale) => ({
      locale,
      translated: translatedByLocale.get(locale) ?? 0,
      total,
    }));
  }
}

/**
 * [0059]: orden del inventario. Se agrega siempre `variant.sku` como
 * desempate para que la paginación sea estable — sin un desempate
 * determinístico, dos páginas consecutivas pueden repetir o saltarse filas
 * cuando hay stock/nombres empatados.
 */
function applyInventorySort(
  query: SelectQueryBuilder<ProductVariantOrmEntity>,
  sort: InventorySort,
): void {
  switch (sort) {
    case InventorySort.STOCK_ASC:
      query.orderBy("variant.stockQuantity", "ASC");
      break;
    case InventorySort.STOCK_DESC:
      query.orderBy("variant.stockQuantity", "DESC");
      break;
    case InventorySort.NAME_DESC:
      query.orderBy("product.name", "DESC");
      break;
    case InventorySort.NAME_ASC:
    default:
      query.orderBy("product.name", "ASC");
      break;
  }
  query.addOrderBy("variant.sku", "ASC");
}
