import { Currency } from "../../../shared-kernel/domain/enums/Currency";
import { ShippingMethod } from "../enums/ShippingMethod";
import { RestrictedProductDetail } from "../exceptions/ProductsRestrictedForZoneException";

export interface ShippingRateReadModel {
  id: string;
  zoneId: string;
  zoneName: string;
  method: ShippingMethod;
  label: string;
  cost: number;
  currency: Currency;
  estimatedMinDays: number;
  estimatedMaxDays: number;
  /** Subtotal a partir del cual esta tarifa queda en cero. `null` = nunca es gratis. */
  freeShippingThreshold: number | null;
}

/**
 * Destino a cotizar. Desde [0049] el departamento y el código postal son
 * opcionales por separado: el carrito puede cotizar con solo el país y un
 * código postal ([0042]), y el checkout siempre manda los tres.
 */
export interface ShippingDestination {
  countryCode: string;
  stateProvince?: string | null;
  postalCode?: string | null;
}

/**
 * Read model de solo lectura para cotizar envíos: devuelve DTOs planos (la
 * tarifa aplicable ya resuelta contra la zona) en vez de hidratar un agregado
 * que nadie muta desde el checkout — ver sección "Queries" del CLAUDE.md del
 * repo.
 *
 * La resolución de zona vive en la query y no en memoria a propósito: la
 * lista de zonas crece con el negocio y no tiene sentido traerla completa en
 * cada cotización.
 */
export interface ShippingRateQueryRepository {
  /**
   * Tarifas activas que cubren el destino, de la más barata a la más cara.
   * Vacío si ninguna zona activa lo cubre.
   */
  findRatesForDestination(destination: ShippingDestination): Promise<ShippingRateReadModel[]>;

  /**
   * [0049]: la zona activa que cubre el destino, o `null` si no hay cobertura.
   * Se consulta aparte de las tarifas porque una zona puede tener
   * restricciones de producto aunque no se le esté pidiendo una cotización.
   */
  findZoneIdForDestination(destination: ShippingDestination): Promise<string | null>;

  /**
   * Cuáles de los productos indicados están restringidos en esa zona, con su
   * motivo. Recibe la lista para no traer la tabla entera: un pedido pregunta
   * por sus líneas, no por el catálogo completo.
   */
  findRestrictedProducts(zoneId: string, productIds: string[]): Promise<RestrictedProductDetail[]>;
}
