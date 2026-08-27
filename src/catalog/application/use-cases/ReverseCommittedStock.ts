import { StockReservationRepository } from "../../domain/repositories/StockReservationRepository";

/**
 * [0059]/[0060]: devuelve el stock de un pedido ya pagado que se canceló o
 * reembolsó. Mismo shape que `CommitStockReservation`/`ReleaseStockReservation`
 * (`ResolveStockReservationPort` en `orders`) para que
 * `UpdateOrderFulfillmentStatus` lo consuma igual.
 */
export class ReverseCommittedStock {
  constructor(private readonly stockReservationRepository: StockReservationRepository) {}

  async execute(input: { referenceId: string }): Promise<void> {
    await this.stockReservationRepository.releaseCommitted(input.referenceId);
  }
}
