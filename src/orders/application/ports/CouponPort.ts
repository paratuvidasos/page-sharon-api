export interface QuotedCoupon {
  code: string;
  discount: number;
}

/**
 * [0027] + [0038]: revalida el cupón y calcula su descuento contra el
 * subtotal real del pedido, justo antes de cobrar. Lo implementa `cart` con
 * `QuoteCoupon` — la vigencia, el mínimo de compra y el límite de usos son
 * reglas del cupón, y el cupón es del carrito.
 */
export interface CouponPort {
  execute(input: { code: string; subtotal: number }): Promise<QuotedCoupon>;
}

/**
 * Marca el cupón como usado. Se llama solo cuando el pago se aprueba
 * ([0039]): contar la redención al colocar el pedido gastaría cupones en
 * compras que nunca se pagaron.
 */
export interface RedeemCouponPort {
  execute(input: { code: string }): Promise<void>;
}
