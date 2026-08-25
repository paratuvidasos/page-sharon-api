import { DomainException } from "../../../shared-kernel/domain/exceptions/DomainException";

/**
 * No hay unidades suficientes de una variante para apartar. Lleva la lista de
 * variantes afectadas para que el checkout pueda señalar exactamente qué
 * línea del pedido falló, en vez de un "algo se agotó" que obliga al
 * comprador a adivinar.
 */
export class VariantOutOfStockException extends DomainException {
  readonly code = "VARIANT_OUT_OF_STOCK";
  readonly statusCode = 409;

  constructor(readonly variantIds: string[]) {
    super(
      variantIds.length === 1
        ? "Uno de los productos de tu pedido se quedó sin stock suficiente."
        : "Algunos productos de tu pedido se quedaron sin stock suficiente.",
    );
  }

  details(): Record<string, unknown> {
    return { variantIds: this.variantIds };
  }
}
