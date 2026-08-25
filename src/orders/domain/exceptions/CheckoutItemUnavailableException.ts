import { DomainException } from "../../../shared-kernel/domain/exceptions/DomainException";

export interface UnavailableLine {
  variantId: string;
  productName: string | null;
  requestedQuantity: number;
  availableQuantity: number;
}

/**
 * [0038]: uno o más productos del pedido dejaron de estar disponibles (se
 * desactivaron o no tienen stock suficiente) al momento de confirmar.
 */
export class CheckoutItemUnavailableException extends DomainException {
  readonly code = "CHECKOUT_ITEM_UNAVAILABLE";
  readonly statusCode = 409;

  constructor(readonly lines: UnavailableLine[]) {
    super("Algunos productos de tu pedido ya no están disponibles en la cantidad solicitada.");
  }

  details(): Record<string, unknown> {
    return { lines: this.lines };
  }
}
