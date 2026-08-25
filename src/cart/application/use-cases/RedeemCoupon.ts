import { CouponRepository } from "../../domain/repositories/CouponRepository";

export interface RedeemCouponInput {
  code: string;
}

/**
 * [0039]: cuenta el uso de un cupón cuando un pedido queda efectivamente
 * pagado.
 *
 * Se hace acá y no al colocar el pedido a propósito: un cupón con límite de
 * usos se gastaría en checkouts abandonados o rechazados si se contara antes
 * de que entre la plata.
 */
export class RedeemCoupon {
  constructor(private readonly couponRepository: CouponRepository) {}

  async execute(input: RedeemCouponInput): Promise<void> {
    await this.couponRepository.incrementRedemptions(input.code.toUpperCase());
  }
}
