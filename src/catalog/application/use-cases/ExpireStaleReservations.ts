import { StockReservationRepository } from "../../domain/repositories/StockReservationRepository";

/**
 * Barrido de reservas vencidas. Corre en un intervalo desde el arranque de la
 * app, además de ejecutarse antes de cada reserva nueva.
 *
 * El intervalo existe para el caso en que nadie compre por un rato: sin él,
 * el stock de un checkout abandonado quedaría congelado hasta que llegara el
 * siguiente comprador.
 */
export class ExpireStaleReservations {
  constructor(private readonly stockReservationRepository: StockReservationRepository) {}

  async execute(): Promise<number> {
    return this.stockReservationRepository.releaseExpired(new Date());
  }
}
