import { DataSource, In, Repository } from "typeorm";
import { PURCHASED_ORDER_STATUSES } from "../../domain/enums/OrderStatus";
import {
  OrderHistoryFilter,
  OrderHistoryItem,
  OrderHistoryPage,
  OrderHistoryPagination,
  OrderQueryRepository,
} from "../../domain/repositories/OrderQueryRepository";
import { OrderItemOrmEntity } from "./entities/OrderItemOrmEntity";
import { OrderOrmEntity } from "./entities/OrderOrmEntity";

// Ahora que existe el flujo de pago, "compra verificada" ([0021]) exige que el
// pedido esté efectivamente pagado. Antes se aceptaba cualquier pedido no
// cancelado por una razón concreta: sin pasarela, un pedido recién colocado se
// quedaba en PENDING para siempre y exigir PAID habría dejado la reseña
// inalcanzable. Esa razón ya no aplica.

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
    // Un pedido es de esta persona si lo hizo con sesión (user_id) o si lo
    // hizo como invitado con el correo de su cuenta. Sin lo segundo, comprar
    // sin iniciar sesión dejaba el pedido invisible para siempre en el
    // historial, aunque hubiera llegado a su propio correo.
    const query = this.orderRepository
      .createQueryBuilder("order")
      .where("(order.userId = :userId OR LOWER(order.guestEmail) = :userEmail)", {
        userId: filter.userId,
        userEmail: filter.userEmail.toLowerCase(),
      });

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

  async hasUserPurchasedProduct(userId: string, productId: string): Promise<boolean> {
    const match = await this.orderItemRepository
      .createQueryBuilder("item")
      .innerJoin("orders", "order", "order.id = item.orderId")
      .where("order.userId = :userId", { userId })
      .andWhere("item.productId = :productId", { productId })
      .andWhere("order.status IN (:...statuses)", { statuses: PURCHASED_ORDER_STATUSES })
      .getOne();

    return match !== null;
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
