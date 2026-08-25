import { Currency } from "../../../shared-kernel/domain/enums/Currency";
import { ShippingMethod } from "../enums/ShippingMethod";

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

export interface ShippingDestination {
  countryCode: string;
  stateProvince: string;
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
}
