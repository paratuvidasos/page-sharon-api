export interface SalesSummary {
  totalSales: number;
  averageTicket: number;
  orderCount: number;
}

export interface TopProductItem {
  productId: string;
  productName: string;
  unitsSold: number;
  revenue: number;
}

export interface SalesReportOrderRow {
  orderNumber: string;
  placedAt: Date;
  status: string;
  paymentMethod: string;
  subtotal: number;
  discount: number;
  shippingCost: number;
  total: number;
}

/**
 * [0062]: read model de solo lectura para el reporte de ventas — agregaciones
 * sobre `orders`/`order_items`, propiedad exclusiva de este módulo (regla 4
 * del CLAUDE.md del repo). Todas escopadas a `PURCHASED_ORDER_STATUSES` para
 * que un pedido cancelado/reembolsado no infle las "ventas".
 *
 * A la escala actual va directo contra las tablas transaccionales; si el
 * volumen crece, evaluar una réplica de lectura o vista materializada antes
 * de seguir agregando filtros acá (advertencia del CLAUDE.md, sección
 * "Queries").
 */
export interface SalesReportQueryRepository {
  getSalesSummary(dateFrom: Date, dateTo: Date): Promise<SalesSummary>;

  getTopProducts(dateFrom: Date, dateTo: Date, limit: number): Promise<TopProductItem[]>;

  /** [0062]: filas de detalle para el export CSV. */
  listOrderRows(dateFrom: Date, dateTo: Date): Promise<SalesReportOrderRow[]>;
}
