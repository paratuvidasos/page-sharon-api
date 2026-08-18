import { PaginationMeta, buildPaginationMeta } from "../../../shared-kernel/infrastructure/http/pagination";
import { OrderStatus } from "../../domain/enums/OrderStatus";
import {
  OrderHistoryItem,
  OrderQueryRepository,
} from "../../domain/repositories/OrderQueryRepository";

export interface GetOrderHistoryInput {
  userId: string;
  status?: OrderStatus;
  dateFrom?: Date;
  dateTo?: Date;
  page: number;
  limit: number;
}

export interface GetOrderHistoryResult {
  items: OrderHistoryItem[];
  meta: PaginationMeta;
}

export class GetOrderHistory {
  constructor(private readonly orderQueryRepository: OrderQueryRepository) {}

  async execute(input: GetOrderHistoryInput): Promise<GetOrderHistoryResult> {
    const { items, total } = await this.orderQueryRepository.listForUserHistory(
      {
        userId: input.userId,
        status: input.status,
        dateFrom: input.dateFrom,
        dateTo: input.dateTo,
      },
      { page: input.page, limit: input.limit },
    );

    return { items, meta: buildPaginationMeta(input.page, input.limit, total) };
  }
}
