import { DomainException } from "../../../shared-kernel/domain/exceptions/DomainException";

export interface ChangedPriceLine {
  variantId: string;
  productName: string;
  previousUnitPrice: number;
  currentUnitPrice: number;
}

/**
 * [0038]: un precio cambió entre que el comprador armó el carrito y que
 * confirmó el pedido.
 *
 * Se corta el checkout en vez de cobrar el precio nuevo en silencio: el
 * criterio de aceptación pide revalidar el precio antes de procesar el pago,
 * y cobrar algo distinto a lo que la persona vio en pantalla no es una
 * revalidación, es una sorpresa. Las líneas afectadas viajan en la excepción
 * para que el frontend pueda mostrar exactamente qué cambió.
 */
export class CheckoutPriceChangedException extends DomainException {
  readonly code = "CHECKOUT_PRICE_CHANGED";
  readonly statusCode = 409;

  constructor(readonly lines: ChangedPriceLine[]) {
    super("El precio de algunos productos cambió. Revisa el resumen antes de continuar.");
  }

  details(): Record<string, unknown> {
    return { lines: this.lines };
  }
}
