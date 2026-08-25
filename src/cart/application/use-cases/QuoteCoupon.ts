import { CouponNotFoundException } from "../../domain/exceptions/CouponNotFoundException";
import { CouponRepository } from "../../domain/repositories/CouponRepository";

export interface QuoteCouponInput {
  code: string;
  subtotal: number;
}

export interface QuoteCouponResult {
  code: string;
  discount: number;
}

/**
 * [0038]: revalida un cupón y calcula su descuento contra el subtotal real,
 * en el momento de confirmar el pedido.
 *
 * Existe aparte de `ApplyCouponToCart` porque el checkout no aplica nada al
 * carrito: solo necesita saber cuánto descuenta el cupón ahora mismo. Un
 * cupón que venció entre que se aplicó al carrito y que se confirmó el pedido
 * tiene que fallar acá, no colarse en el cobro.
 */
export class QuoteCoupon {
  constructor(private readonly couponRepository: CouponRepository) {}

  async execute(input: QuoteCouponInput): Promise<QuoteCouponResult> {
    const coupon = await this.couponRepository.findByCode(input.code.toUpperCase());
    if (!coupon) {
      throw new CouponNotFoundException();
    }

    coupon.assertApplicable(input.subtotal, new Date());

    return { code: coupon.code, discount: coupon.discountAmount(input.subtotal) };
  }
}
