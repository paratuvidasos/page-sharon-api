import { PaginationMeta, buildPaginationMeta } from "../../../../shared-kernel/infrastructure/http/pagination";
import { UserStatus } from "../../../domain/enums/UserStatus";
import { CustomerListItem, UserQueryRepository } from "../../../domain/repositories/UserQueryRepository";

export interface CustomerOrderSummary {
  orderCount: number;
  totalSpent: number;
  lastOrderAt: Date;
}

/** Puerto expuesto por `orders` — ver `GetOrderSummaryForUsers`. */
export interface GetOrderSummaryForUsersPort {
  execute(input: { userIds: string[] }): Promise<Map<string, CustomerOrderSummary>>;
}

export interface CustomerListItemWithSummary extends CustomerListItem {
  orderCount: number;
  totalSpent: number;
  lastOrderAt: Date | null;
}

export interface ListCustomersInput {
  page: number;
  limit: number;
  search?: string;
  status?: UserStatus;
}

export interface ListCustomersResult {
  items: CustomerListItemWithSummary[];
  meta: PaginationMeta;
}

/**
 * [0063]: listado de clientes con resumen de compras para el panel
 * administrativo. El resumen se resuelve con un puerto expuesto por
 * `orders` porque `accounts` no puede leer sus tablas (regla 2/4 del
 * CLAUDE.md del repo) — mismo patrón que `HasUserPurchasedProduct` entre
 * `orders` y `aftersales`.
 */
export class ListCustomers {
  constructor(
    private readonly userQueryRepository: UserQueryRepository,
    private readonly getOrderSummaryForUsersPort: GetOrderSummaryForUsersPort,
  ) {}

  async execute(input: ListCustomersInput): Promise<ListCustomersResult> {
    const { items, total } = await this.userQueryRepository.listCustomers(
      { search: input.search, status: input.status },
      { page: input.page, limit: input.limit },
    );

    const summaries = await this.getOrderSummaryForUsersPort.execute({
      userIds: items.map((item) => item.id),
    });

    const itemsWithSummary: CustomerListItemWithSummary[] = items.map((item) => {
      const summary = summaries.get(item.id);
      return {
        ...item,
        orderCount: summary?.orderCount ?? 0,
        totalSpent: summary?.totalSpent ?? 0,
        lastOrderAt: summary?.lastOrderAt ?? null,
      };
    });

    return { items: itemsWithSummary, meta: buildPaginationMeta(input.page, input.limit, total) };
  }
}
