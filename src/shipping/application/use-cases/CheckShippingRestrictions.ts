import { NoShippingCoverageException } from "../../domain/exceptions/NoShippingCoverageException";
import { ProductsRestrictedForZoneException } from "../../domain/exceptions/ProductsRestrictedForZoneException";
import { ShippingRateQueryRepository } from "../../domain/repositories/ShippingRateQueryRepository";

export interface CheckShippingRestrictionsInput {
  countryCode: string;
  stateProvince: string | null;
  postalCode: string | null;
  productIds: string[];
}

/**
 * [0049]: verifica que todos los productos de un pedido se puedan enviar al
 * destino, y corta si alguno no.
 *
 * Es el caso de uso que `orders` consume en el checkout (vía
 * `ShippingRestrictionPort`), y por eso no devuelve la lista sino que lanza:
 * en un checkout no hay decisión que tomar, el pedido no se puede colocar. La
 * calculadora de envío ([0042]) sí quiere la lista sin excepción, y para eso
 * consulta el read model directamente desde `GetShippingOptions`, que ya
 * tiene la zona resuelta.
 */
export class CheckShippingRestrictions {
  constructor(private readonly shippingRateQueryRepository: ShippingRateQueryRepository) {}

  async execute(input: CheckShippingRestrictionsInput): Promise<void> {
    if (input.productIds.length === 0) {
      return;
    }

    const zoneId = await this.shippingRateQueryRepository.findZoneIdForDestination({
      countryCode: input.countryCode,
      stateProvince: input.stateProvince,
      postalCode: input.postalCode,
    });

    if (!zoneId) {
      throw new NoShippingCoverageException();
    }

    const restricted = await this.shippingRateQueryRepository.findRestrictedProducts(
      zoneId,
      // Sin duplicados: dos variantes del mismo producto en el carrito no
      // tienen por qué aparecer dos veces en el mensaje de error.
      Array.from(new Set(input.productIds)),
    );

    if (restricted.length > 0) {
      throw new ProductsRestrictedForZoneException(restricted);
    }
  }
}
