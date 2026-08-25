import { StockReservationRepository } from "../../domain/repositories/StockReservationRepository";

export interface CommitStockReservationInput {
  referenceId: string;
}

/**
 * [0038]: cierra la reserva de un pedido cuyo pago fue aprobado.
 *
 * No descuenta nada: el stock ya se descontó al apartar. Confirmar solo
 * impide que el barrido de vencidas devuelva unidades de un pedido que sí se
 * pagó.
 */
export class CommitStockReservation {
  constructor(private readonly stockReservationRepository: StockReservationRepository) {}

  async execute(input: CommitStockReservationInput): Promise<void> {
    await this.stockReservationRepository.commit(input.referenceId);
  }
}
