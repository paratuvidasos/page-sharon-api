import {
  StockReservationLine,
  StockReservationRepository,
} from "../../domain/repositories/StockReservationRepository";

export interface ReserveStockInput {
  /** Id del pedido al que se le aparta el stock. */
  referenceId: string;
  lines: StockReservationLine[];
  expiresAt: Date;
}

/**
 * [0038]: aparta las unidades de un pedido mientras se resuelve su pago.
 *
 * Antes de apartar barre las reservas vencidas, para que el stock que quedó
 * congelado por un checkout abandonado vuelva a estar disponible justo cuando
 * alguien lo necesita. Con eso, el barrido periódico deja de ser el único
 * mecanismo de recuperación.
 *
 * `orders` lo consume vía puerto: nunca toca `product_variants` directamente.
 */
export class ReserveStock {
  constructor(private readonly stockReservationRepository: StockReservationRepository) {}

  async execute(input: ReserveStockInput): Promise<void> {
    await this.stockReservationRepository.releaseExpired(new Date());
    await this.stockReservationRepository.hold(input.referenceId, input.lines, input.expiresAt);
  }
}
