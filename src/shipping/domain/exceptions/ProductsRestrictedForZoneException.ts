import { DomainException } from "../../../shared-kernel/domain/exceptions/DomainException";

export interface RestrictedProductDetail {
  productId: string;
  /** Motivo configurado por el administrador (ej. una restricción de aduana). */
  reason: string | null;
}

/**
 * [0049]: el pedido incluye productos que no se pueden enviar a la zona de
 * destino.
 *
 * Es 422 por la misma razón que `NoShippingCoverageException`: la petición
 * está bien formada, pero la configuración de envíos de hoy no permite
 * cumplirla.
 *
 * Lleva los productos afectados en `details()` porque el mensaje solo no le
 * alcanza a la interfaz para reaccionar: sin la lista tendría que adivinar
 * cuáles de las líneas del carrito hay que señalar. Es el mismo mecanismo que
 * usa `CheckoutPriceChangedException` desde [0038].
 */
export class ProductsRestrictedForZoneException extends DomainException {
  readonly code = "PRODUCTS_RESTRICTED_FOR_ZONE";
  readonly statusCode = 422;

  constructor(private readonly restrictedProducts: RestrictedProductDetail[]) {
    super("Algunos productos de tu pedido no se pueden enviar a esa zona.");
  }

  details(): Record<string, unknown> {
    return { restrictedProducts: this.restrictedProducts };
  }
}
