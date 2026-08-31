import { Locale } from "../../../shared-kernel/domain/enums/Locale";
import { PaginationMeta, buildPaginationMeta } from "../../../shared-kernel/infrastructure/http/pagination";
import { ProductSort } from "../../domain/enums/ProductSort";
import { ProductStatus } from "../../domain/enums/ProductStatus";
import { StockStatus } from "../../domain/enums/StockStatus";
import { ProductQueryRepository } from "../../domain/repositories/ProductQueryRepository";
import { ProductRatingSummary, RatingSummaryPort } from "../ports/RatingSummaryPort";

export interface ListProductsInput {
  page: number;
  limit: number;
  categoryId?: string;
  hairType?: string;
  line?: string;
  mainIngredient?: string;
  priceMin?: number;
  priceMax?: number;
  sort?: ProductSort;
  locale: Locale;
}

export interface ListProductsResultItem {
  id: string;
  slug: string;
  name: string;
  thumbnailUrl: string | null;
  basePrice: number;
  compareAtPrice: number | null;
  stockStatus: StockStatus;
  rating: ProductRatingSummary;
}

export interface ListProductsResult {
  items: ListProductsResultItem[];
  meta: PaginationMeta;
}

const NO_RATING: ProductRatingSummary = { average: null, count: 0 };

/**
 * Caso de uso único detrás de `GET /products`: acumula paginación ([0013]),
 * filtro de categoría ([0016]), filtros de atributos/precio ([0017]) y orden
 * ([0019]) en vez de tener un endpoint por historia — ver "Decisiones de
 * diseño clave" del plan de [0013]-[0022].
 */
export class ListProducts {
  constructor(
    private readonly productQueryRepository: ProductQueryRepository,
    private readonly ratingSummaryPort?: RatingSummaryPort,
  ) {}

  async execute(input: ListProductsInput): Promise<ListProductsResult> {
    const { items, total } = await this.productQueryRepository.listForCatalogPage(
      {
        status: ProductStatus.ACTIVE,
        categoryId: input.categoryId,
        attributes: {
          hairType: input.hairType,
          line: input.line,
          mainIngredient: input.mainIngredient,
        },
        priceMin: input.priceMin,
        priceMax: input.priceMax,
        sort: input.sort,
      },
      { page: input.page, limit: input.limit },
      input.locale,
    );

    const ratings =
      items.length > 0 && this.ratingSummaryPort
        ? await this.ratingSummaryPort.execute({ productIds: items.map((item) => item.id) })
        : new Map<string, ProductRatingSummary>();

    return {
      items: items.map((item) => ({
        ...item,
        rating: ratings.get(item.id) ?? NO_RATING,
      })),
      meta: buildPaginationMeta(input.page, input.limit, total),
    };
  }
}
