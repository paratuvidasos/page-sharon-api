import { CouponNotFoundException } from "../../domain/exceptions/CouponNotFoundException";
import { CouponRepository } from "../../domain/repositories/CouponRepository";

export interface QuoteCouponLine {
  productId: string;
  quantity: number;
  unitPrice: number;
}

export interface QuoteCouponInput {
  code: string;
  lines: QuoteCouponLine[];
}

export interface QuoteCouponResult {
  code: string;
  discount: number;
}

/**
 * [0038]: revalida un cupón y calcula su descuento contra las líneas reales
 * del pedido, en el momento de confirmar el pedido.
 *
 * Existe aparte de `ApplyCouponToCart` porque el checkout no aplica nada al
 * carrito: solo necesita saber cuánto descuenta el cupón ahora mismo. Un
 * cupón que venció entre que se aplicó al carrito y que se confirmó el pedido
 * tiene que fallar acá, no colarse en el cobro.
 *
 * [0061]: recibe líneas y no un subtotal ya sumado — un cupón restringido a
 * ciertos productos necesita saber cuáles líneas son para aplicar el
 * descuento solo sobre esas, igual que `computeCartTotals`.
 */
export class QuoteCoupon {
  constructor(private readonly couponRepository: CouponRepository) {}

  async execute(input: QuoteCouponInput): Promise<QuoteCouponResult> {
    const coupon = await this.couponRepository.findByCode(input.code.toUpperCase());
    if (!coupon) {
      throw new CouponNotFoundException();
    }

    const subtotal = input.lines.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0);
    coupon.assertApplicable(subtotal, new Date());

    const applicableSubtotal = input.lines
      .filter((line) => coupon.appliesToProduct(line.productId))
      .reduce((sum, line) => sum + line.unitPrice * line.quantity, 0);

    return { code: coupon.code, discount: coupon.discountAmount(applicableSubtotal) };
  }
}
