import { OrderRepository } from "../../domain/repositories/OrderRepository";

export interface AnonymizeUserOrdersInput {
  userId: string;
}

export class AnonymizeUserOrders {
  constructor(private readonly orderRepository: OrderRepository) {}

  async execute(input: AnonymizeUserOrdersInput): Promise<void> {
    await this.orderRepository.anonymizeShippingSnapshotForUser(input.userId);
  }
}
