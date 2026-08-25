import { PaginationMeta, buildPaginationMeta } from "../../../shared-kernel/infrastructure/http/pagination";
import { OrderStatus } from "../../domain/enums/OrderStatus";
import {
  OrderHistoryItem,
  OrderQueryRepository,
} from "../../domain/repositories/OrderQueryRepository";
import { CustomerContactPort } from "../ports/CustomerContactPort";

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
  constructor(
    private readonly orderQueryRepository: OrderQueryRepository,
    private readonly customerContactPort: CustomerContactPort,
  ) {}

  async execute(input: GetOrderHistoryInput): Promise<GetOrderHistoryResult> {
    // El correo se resuelve acá y no llega en el input: viene de la cuenta,
    // no de la petición, así que nadie puede pedir el historial de otro
    // mandando un correo ajeno.
    const { email } = await this.customerContactPort.execute({ userId: input.userId });

    const { items, total } = await this.orderQueryRepository.listForUserHistory(
      {
        userId: input.userId,
        userEmail: email,
        status: input.status,
        dateFrom: input.dateFrom,
        dateTo: input.dateTo,
      },
      { page: input.page, limit: input.limit },
    );

    return { items, meta: buildPaginationMeta(input.page, input.limit, total) };
  }
}
