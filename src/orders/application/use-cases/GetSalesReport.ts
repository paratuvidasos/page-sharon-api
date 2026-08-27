import {
  SalesReportQueryRepository,
  SalesSummary,
  TopProductItem,
} from "../../domain/repositories/SalesReportQueryRepository";

export interface GetSalesReportInput {
  dateFrom: Date;
  dateTo: Date;
  topProductsLimit?: number;
}

export interface GetSalesReportResult {
  summary: SalesSummary;
  topProducts: TopProductItem[];
}

const DEFAULT_TOP_PRODUCTS_LIMIT = 10;

/** [0062]: ventas totales, ticket promedio y productos más vendidos, filtrado por rango de fechas. */
export class GetSalesReport {
  constructor(private readonly salesReportQueryRepository: SalesReportQueryRepository) {}

  async execute(input: GetSalesReportInput): Promise<GetSalesReportResult> {
    const [summary, topProducts] = await Promise.all([
      this.salesReportQueryRepository.getSalesSummary(input.dateFrom, input.dateTo),
      this.salesReportQueryRepository.getTopProducts(
        input.dateFrom,
        input.dateTo,
        input.topProductsLimit ?? DEFAULT_TOP_PRODUCTS_LIMIT,
      ),
    ]);

    return { summary, topProducts };
  }
}
