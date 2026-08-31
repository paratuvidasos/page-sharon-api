import { StockReservationRepository } from "../../domain/repositories/StockReservationRepository";

export interface ReleaseStockReservationInput {
  referenceId: string;
}

/**
 * [0040]: devuelve al catálogo las unidades apartadas para un pedido cuyo
 * pago no prosperó. Idempotente: solo actúa sobre reservas que sigan en HELD.
 */
export class ReleaseStockReservation {
  constructor(private readonly stockReservationRepository: StockReservationRepository) {}

  async execute(input: ReleaseStockReservationInput): Promise<void> {
    await this.stockReservationRepository.release(input.referenceId);
  }
}
