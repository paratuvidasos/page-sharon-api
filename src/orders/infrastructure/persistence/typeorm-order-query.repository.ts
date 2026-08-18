import { DataSource, In, Repository } from "typeorm";
import {
  OrderHistoryFilter,
  OrderHistoryItem,
  OrderHistoryPage,
  OrderHistoryPagination,
  OrderQueryRepository,
} from "../../domain/repositories/OrderQueryRepository";
import { OrderItemOrmEntity } from "./entities/OrderItemOrmEntity";
import { OrderOrmEntity } from "./entities/OrderOrmEntity";

export class TypeOrmOrderQueryRepository implements OrderQueryRepository {
  private readonly orderRepository: Repository<OrderOrmEntity>;
  private readonly orderItemRepository: Repository<OrderItemOrmEntity>;

  constructor(dataSource: DataSource) {
    this.orderRepository = dataSource.getRepository(OrderOrmEntity);
    this.orderItemRepository = dataSource.getRepository(OrderItemOrmEntity);
  }

  async listForUserHistory(
    filter: OrderHistoryFilter,
    pagination: OrderHistoryPagination,
  ): Promise<OrderHistoryPage> {
    const query = this.orderRepository
      .createQueryBuilder("order")
      .where("order.userId = :userId", { userId: filter.userId });

    if (filter.status) {
      query.andWhere("order.status = :status", { status: filter.status });
    }
    if (filter.dateFrom) {
      query.andWhere("order.placedAt >= :dateFrom", { dateFrom: filter.dateFrom });
    }
    if (filter.dateTo) {
      query.andWhere("order.placedAt <= :dateTo", { dateTo: filter.dateTo });
    }

    query
      .orderBy("order.placedAt", "DESC")
      .skip((pagination.page - 1) * pagination.limit)
      .take(pagination.limit);

    const [orders, total] = await query.getManyAndCount();

    if (orders.length === 0) {
      return { items: [], total };
    }

    // Los items se traen en una segunda consulta (IN sobre los ids de la
    // página) en vez de leftJoinAndSelect: un join en la misma query que
    // pagina (skip/take) rompe el conteo porque TypeORM pagina filas del
    // join, no pedidos. Con dos consultas queda 1 (pedidos) + 1 (items),
    // sin N+1 y con la paginación correcta.
    const items = await this.orderItemRepository.find({
      where: { orderId: In(orders.map((order) => order.id)) },
    });

    const itemsByOrderId = new Map<string, OrderItemOrmEntity[]>();
    for (const item of items) {
      const list = itemsByOrderId.get(item.orderId) ?? [];
      list.push(item);
      itemsByOrderId.set(item.orderId, list);
    }

    return {
      items: orders.map((order) => toOrderHistoryItem(order, itemsByOrderId.get(order.id) ?? [])),
      total,
    };
  }
}

function toOrderHistoryItem(order: OrderOrmEntity, items: OrderItemOrmEntity[]): OrderHistoryItem {
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    placedAt: order.placedAt,
    currency: order.currency,
    subtotal: Number(order.subtotal),
    shippingCost: Number(order.shippingCost),
    total: Number(order.total),
    paymentMethod: order.paymentMethod,
    paymentMethodLabel: order.paymentMethodLabel,
    shippingAddress: {
      recipientName: order.shippingRecipientName,
      phone: order.shippingPhone,
      countryCode: order.shippingCountryCode,
      stateProvince: order.shippingStateProvince,
      city: order.shippingCity,
      postalCode: order.shippingPostalCode,
      streetLine1: order.shippingStreetLine1,
      streetLine2: order.shippingStreetLine2,
    },
    items: items.map((item) => ({
      productId: item.productId,
      productName: item.productName,
      sku: item.sku,
      unitPrice: Number(item.unitPrice),
      quantity: item.quantity,
      lineTotal: Number(item.lineTotal),
    })),
  };
}
