import { CustomerOrderSummary, OrderQueryRepository } from "../../domain/repositories/OrderQueryRepository";

/**
 * [0063]: puerto expuesto a `accounts` para el resumen de compras
 * (pedidos/gastado) del listado de clientes del panel administrativo —
 * mismo patrón que `HasUserPurchasedProduct` expuesto a `aftersales`.
 */
export class GetOrderSummaryForUsers {
  constructor(private readonly orderQueryRepository: OrderQueryRepository) {}

  async execute(input: { userIds: string[] }): Promise<Map<string, CustomerOrderSummary>> {
    return this.orderQueryRepository.getSummaryForUsers(input.userIds);
  }
}
