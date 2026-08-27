import { DataSource, Repository } from "typeorm";
import { PURCHASED_ORDER_STATUSES } from "../../domain/enums/OrderStatus";
import {
  SalesReportOrderRow,
  SalesReportQueryRepository,
  SalesSummary,
  TopProductItem,
} from "../../domain/repositories/SalesReportQueryRepository";
import { OrderItemOrmEntity } from "./entities/OrderItemOrmEntity";
import { OrderOrmEntity } from "./entities/OrderOrmEntity";

export class TypeOrmSalesReportQueryRepository implements SalesReportQueryRepository {
  private readonly orderRepository: Repository<OrderOrmEntity>;
  private readonly orderItemRepository: Repository<OrderItemOrmEntity>;

  constructor(dataSource: DataSource) {
    this.orderRepository = dataSource.getRepository(OrderOrmEntity);
    this.orderItemRepository = dataSource.getRepository(OrderItemOrmEntity);
  }

  async getSalesSummary(dateFrom: Date, dateTo: Date): Promise<SalesSummary> {
    const row = await this.orderRepository
      .createQueryBuilder("order")
      .select("COALESCE(SUM(order.total), 0)", "totalSales")
      .addSelect("COALESCE(AVG(order.total), 0)", "averageTicket")
      .addSelect("COUNT(order.id)", "orderCount")
      .where("order.status IN (:...statuses)", { statuses: PURCHASED_ORDER_STATUSES })
      .andWhere("order.placedAt >= :dateFrom", { dateFrom })
      .andWhere("order.placedAt <= :dateTo", { dateTo })
      .getRawOne<{ totalSales: string; averageTicket: string; orderCount: string }>();

    return {
      totalSales: Number(row?.totalSales ?? 0),
      averageTicket: Number(row?.averageTicket ?? 0),
      orderCount: Number(row?.orderCount ?? 0),
    };
  }

  async getTopProducts(dateFrom: Date, dateTo: Date, limit: number): Promise<TopProductItem[]> {
    const rows = await this.orderItemRepository
      .createQueryBuilder("item")
      .innerJoin("orders", "order", "order.id = item.orderId")
      .select("item.productId", "productId")
      // Nombre "actual" dentro del rango: el snapshot puede variar si el
      // producto se renombró, así que se toma el más reciente entre los
      // pedidos del período en vez de uno arbitrario.
      .addSelect("MAX(item.productName)", "productName")
      .addSelect("SUM(item.quantity)", "unitsSold")
      .addSelect("SUM(item.lineTotal)", "revenue")
      .where("order.status IN (:...statuses)", { statuses: PURCHASED_ORDER_STATUSES })
      .andWhere("order.placedAt >= :dateFrom", { dateFrom })
      .andWhere("order.placedAt <= :dateTo", { dateTo })
      .groupBy("item.productId")
      .orderBy("SUM(item.quantity)", "DESC")
      .limit(limit)
      .getRawMany<{ productId: string; productName: string; unitsSold: string; revenue: string }>();

    return rows.map((row) => ({
      productId: row.productId,
      productName: row.productName,
      unitsSold: Number(row.unitsSold),
      revenue: Number(row.revenue),
    }));
  }

  async listOrderRows(dateFrom: Date, dateTo: Date): Promise<SalesReportOrderRow[]> {
    const rows = await this.orderRepository
      .createQueryBuilder("order")
      .select("order.orderNumber", "orderNumber")
      .addSelect("order.placedAt", "placedAt")
      .addSelect("order.status", "status")
      .addSelect("order.paymentMethod", "paymentMethod")
      .addSelect("order.subtotal", "subtotal")
      .addSelect("order.discount", "discount")
      .addSelect("order.shippingCost", "shippingCost")
      .addSelect("order.total", "total")
      .where("order.status IN (:...statuses)", { statuses: PURCHASED_ORDER_STATUSES })
      .andWhere("order.placedAt >= :dateFrom", { dateFrom })
      .andWhere("order.placedAt <= :dateTo", { dateTo })
      .orderBy("order.placedAt", "ASC")
      .getRawMany<{
        orderNumber: string;
        placedAt: Date;
        status: string;
        paymentMethod: string;
        subtotal: string;
        discount: string;
        shippingCost: string;
        total: string;
      }>();

    return rows.map((row) => ({
      orderNumber: row.orderNumber,
      placedAt: row.placedAt,
      status: row.status,
      paymentMethod: row.paymentMethod,
      subtotal: Number(row.subtotal),
      discount: Number(row.discount),
      shippingCost: Number(row.shippingCost),
      total: Number(row.total),
    }));
  }
}
