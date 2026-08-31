import { Locale } from "../../../shared-kernel/domain/enums/Locale";
import { InventorySort } from "../enums/InventorySort";
import { ProductSort } from "../enums/ProductSort";
import { ProductStatus } from "../enums/ProductStatus";
import { StockStatus } from "../enums/StockStatus";

export interface ProductAttributeFilter {
  hairType?: string;
  line?: string;
  mainIngredient?: string;
}

export interface ProductListFilter {
  status: ProductStatus;
  categoryId?: string;
  attributes?: ProductAttributeFilter;
  priceMin?: number;
  priceMax?: number;
  sort?: ProductSort;
}

export interface ProductListPagination {
  page: number;
  limit: number;
}

export interface ProductListItem {
  id: string;
  slug: string;
  name: string;
  thumbnailUrl: string | null;
  basePrice: number;
  compareAtPrice: number | null;
  stockStatus: StockStatus;
}

export interface ProductListPage {
  items: ProductListItem[];
  total: number;
}

export interface ProductFacetOption {
  value: string;
  count: number;
}

export interface ProductPriceRange {
  min: number;
  max: number;
}

export interface ProductFilterFacets {
  hairType: ProductFacetOption[];
  line: ProductFacetOption[];
  mainIngredient: ProductFacetOption[];
  priceRange: ProductPriceRange;
}

export interface ProductFilterFacetsFilter {
  status: ProductStatus;
  categoryId?: string;
}

export interface ProductSuggestion {
  id: string;
  slug: string;
  name: string;
  thumbnailUrl: string | null;
}

export interface RelatedProductsFilter {
  productId: string;
  categoryId: string;
  limit: number;
}

export interface ProductVariantSnapshot {
  productId: string;
  variantId: string;
  productName: string;
  /** Necesario para el snapshot de la línea del pedido ([0038]). */
  sku: string;
  variantLabel: string | null;
  thumbnailUrl: string | null;
  unitPrice: number;
  stockQuantity: number;
  isActive: boolean;
  /** [0048]: medidas del bulto, para que `shipping` pueda cotizar con la transportadora. */
  weightGrams: number;
  lengthCm: number | null;
  widthCm: number | null;
  heightCm: number | null;
}

export interface LowStockVariantItem {
  productId: string;
  productName: string;
  variantId: string;
  sku: string;
  variantLabel: string | null;
  stockQuantity: number;
  lowStockThreshold: number | null;
}

export interface LowStockVariantPage {
  items: LowStockVariantItem[];
  total: number;
}

/**
 * Read model de solo lectura para el listado de catálogo — devuelve DTOs
 * planos en vez del agregado `Product` completo (ver sección "Queries" del
 * CLAUDE.md del repo). Este contrato se amplía en las US [0016], [0017] y
 * [0019] con filtros de categoría/atributos/precio y orden, sin cambiar su
 * forma general.
 */
export interface ProductQueryRepository {
  listForCatalogPage(filter: ProductListFilter, pagination: ProductListPagination, locale: Locale): Promise<ProductListPage>;

  /**
   * Facetas para [0017]: cuenta resultados por cada valor de atributo
   * (tipo de cabello, línea, ingrediente principal) y el rango de precio
   * disponible, respetando el filtro de categoría/status pero SIN aplicar
   * los propios filtros de atributo/precio (los conteos deben reflejar "si
   * agrego este filtro, cuántos resultados quedan", no el resultado ya
   * filtrado).
   */
  getAvailableFilters(filter: ProductFilterFacetsFilter): Promise<ProductFilterFacets>;

  /**
   * [0018]: full-text sobre nombre/marca/descripción/ingredientes (columna
   * generada `search_vector`) más coincidencia por nombre de categoría, solo
   * sobre productos activos.
   */
  searchByKeyword(term: string, pagination: ProductListPagination, locale: Locale): Promise<ProductListPage>;

  /** [0018]: autocompletado por prefijo de nombre, acotado a `limit`. */
  suggestByPrefix(prefix: string, limit: number, locale: Locale): Promise<ProductSuggestion[]>;

  /**
   * [0020]: misma categoría, excluye el propio producto y los que no
   * tengan ninguna variante con stock, ordenado por más vendidos.
   */
  findRelatedProducts(filter: RelatedProductsFilter, locale: Locale): Promise<ProductListItem[]>;

  /**
   * [0022]: destacados (marcados desde admin) unidos con los que están en
   * oferta (`compareAtPrice` seteado) — una query en vivo, así que la
   * sección se actualiza sola cuando cambian las ofertas activas, sin caché
   * a invalidar.
   */
  listFeaturedAndOnSale(limit: number, locale: Locale): Promise<ProductListItem[]>;

  /**
   * Puerto consumido por `cart` a través de `GetCartProductSnapshots` (ver
   * regla 2 del CLAUDE.md del repo — `cart` nunca importa la
   * infraestructura de `catalog`): nombre, imagen, precio efectivo, stock
   * y estado activo por variante, para validar el carrito contra el
   * catálogo vigente.
   */
  findVariantSnapshots(variantIds: string[], locale: Locale): Promise<ProductVariantSnapshot[]>;

  /**
   * [0066]: productos activos por id, en el orden pedido — respalda el modo
   * `MANUAL` de destacados de home (`HomepageFeaturedConfig.manualProductIds`).
   * Un id que no exista o no esté ACTIVE simplemente no aparece en el
   * resultado.
   */
  findByIds(productIds: string[], locale: Locale): Promise<ProductListItem[]>;

  /** [0066]: regla automática "más vendidos" de destacados de home. Excluye sin stock, igual que `findRelatedProducts`. */
  listTopSelling(limit: number, locale: Locale): Promise<ProductListItem[]>;

  /** [0066]: regla automática "novedades" de destacados de home. Excluye sin stock, igual que `findRelatedProducts`. */
  listNewest(limit: number, locale: Locale): Promise<ProductListItem[]>;

  /**
   * [0059]: variantes en `stock_quantity <= COALESCE(low_stock_threshold, 5)`
   * — respalda el listado admin `GET /admin/inventory/low-stock` (pull, sin
   * notificación push, decisión confirmada con el usuario). Incluye
   * agotadas (`stock_quantity = 0`): es el caso más urgente de "stock bajo".
   */
  listLowStock(pagination: ProductListPagination): Promise<LowStockVariantPage>;

  /**
   * [0059]: inventario general — todas las variantes con su stock, sin
   * filtrar por umbral por defecto. Respalda "ver y editar el stock de cada
   * producto y variante" (AC), que es más amplio que la alerta de stock bajo
   * (`listLowStock` es solo el subconjunto en alerta). Los filtros y el
   * orden son para que el admin pueda encontrar una variante puntual en un
   * catálogo grande, no solo hojear página por página.
   */
  listAllVariants(
    filter: InventoryListFilter,
    pagination: ProductListPagination,
  ): Promise<LowStockVariantPage>;

  /**
   * [0069]: cuántos productos activos tienen traducción por idioma, contra
   * el total de productos activos — respalda el reporte de cobertura del
   * panel administrativo. Devuelve una fila por idioma en `locales` aunque
   * esté en cero.
   */
  countTranslatedByLocale(locales: Locale[]): Promise<TranslationCoverageItem[]>;
}

export interface TranslationCoverageItem {
  locale: Locale;
  translated: number;
  total: number;
}

export interface InventoryListFilter {
  /** Coincidencia parcial contra el nombre del producto o el SKU de la variante. */
  search?: string;
  categoryId?: string;
  /** Mismo criterio que `listLowStock`: stock <= umbral (5 por defecto, o el configurado por variante). */
  onlyLowStock?: boolean;
  sort?: InventorySort;
}
