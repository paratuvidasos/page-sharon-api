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

/**
 * Read model de solo lectura para el listado de catálogo — devuelve DTOs
 * planos en vez del agregado `Product` completo (ver sección "Queries" del
 * CLAUDE.md del repo). Este contrato se amplía en las US [0016], [0017] y
 * [0019] con filtros de categoría/atributos/precio y orden, sin cambiar su
 * forma general.
 */
export interface ProductQueryRepository {
  listForCatalogPage(filter: ProductListFilter, pagination: ProductListPagination): Promise<ProductListPage>;

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
  searchByKeyword(term: string, pagination: ProductListPagination): Promise<ProductListPage>;

  /** [0018]: autocompletado por prefijo de nombre, acotado a `limit`. */
  suggestByPrefix(prefix: string, limit: number): Promise<ProductSuggestion[]>;

  /**
   * [0020]: misma categoría, excluye el propio producto y los que no
   * tengan ninguna variante con stock, ordenado por más vendidos.
   */
  findRelatedProducts(filter: RelatedProductsFilter): Promise<ProductListItem[]>;

  /**
   * [0022]: destacados (marcados desde admin) unidos con los que están en
   * oferta (`compareAtPrice` seteado) — una query en vivo, así que la
   * sección se actualiza sola cuando cambian las ofertas activas, sin caché
   * a invalidar.
   */
  listFeaturedAndOnSale(limit: number): Promise<ProductListItem[]>;
}
