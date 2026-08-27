import { PaginationMeta, buildPaginationMeta } from "../../../shared-kernel/infrastructure/http/pagination";
import { PaymentMethod } from "../../../shared-kernel/domain/enums/PaymentMethod";
import { OrderStatus } from "../../domain/enums/OrderStatus";
import { OrderHistoryItem, OrderQueryRepository } from "../../domain/repositories/OrderQueryRepository";

export interface AdminListOrdersInput {
  page: number;
  limit: number;
  status?: OrderStatus;
  dateFrom?: Date;
  dateTo?: Date;
  paymentMethod?: PaymentMethod;
  userId?: string;
}

export interface AdminListOrdersResult {
  items: OrderHistoryItem[];
  meta: PaginationMeta;
}

/**
 * [0060]: listado de pedidos para el panel administrativo, filtrable por
 * estado, fecha y método de pago. `userId` opcional lo reutiliza [0063]
 * para "ver el detalle de pedidos asociados a cada cliente".
 */
export class AdminListOrders {
  constructor(private readonly orderQueryRepository: OrderQueryRepository) {}

  async execute(input: AdminListOrdersInput): Promise<AdminListOrdersResult> {
    const { items, total } = await this.orderQueryRepository.listForAdmin(
      {
        status: input.status,
        dateFrom: input.dateFrom,
        dateTo: input.dateTo,
        paymentMethod: input.paymentMethod,
        userId: input.userId,
      },
      { page: input.page, limit: input.limit },
    );

    return { items, meta: buildPaginationMeta(input.page, input.limit, total) };
  }
}
