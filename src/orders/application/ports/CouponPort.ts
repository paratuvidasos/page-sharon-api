export interface QuotedCoupon {
  code: string;
  discount: number;
}

export interface CouponQuoteLine {
  productId: string;
  quantity: number;
  unitPrice: number;
}

/**
 * [0027] + [0038]: revalida el cupón y calcula su descuento contra las
 * líneas reales del pedido, justo antes de cobrar. Lo implementa `cart` con
 * `QuoteCoupon` — la vigencia, el mínimo de compra y el límite de usos son
 * reglas del cupón, y el cupón es del carrito.
 *
 * Recibe las líneas (no un `subtotal` ya sumado) desde [0061]: un cupón
 * restringido a ciertos productos necesita saber CUÁLES líneas son para
 * aplicar el descuento solo sobre esas — con un total ya agregado no hay
 * forma de distinguirlas acá.
 */
export interface CouponPort {
  execute(input: { code: string; lines: CouponQuoteLine[] }): Promise<QuotedCoupon>;
}

/**
 * Marca el cupón como usado. Se llama solo cuando el pago se aprueba
 * ([0039]): contar la redención al colocar el pedido gastaría cupones en
 * compras que nunca se pagaron.
 */
export interface RedeemCouponPort {
  execute(input: { code: string }): Promise<void>;
}
