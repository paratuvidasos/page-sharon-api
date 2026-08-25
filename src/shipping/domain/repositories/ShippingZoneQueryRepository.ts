import { Currency } from "../../../shared-kernel/domain/enums/Currency";
import { ShippingMethod } from "../enums/ShippingMethod";

export interface ShippingZoneRateReadModel {
  method: ShippingMethod;
  label: string;
  cost: number;
  currency: Currency;
  estimatedMinDays: number;
  estimatedMaxDays: number;
  freeShippingThreshold: number | null;
  isActive: boolean;
}

export interface ShippingZoneRestrictionReadModel {
  productId: string;
  reason: string | null;
}

export interface ShippingZoneReadModel {
  id: string;
  name: string;
  countryCode: string;
  stateProvinces: string[] | null;
  postalCodePatterns: string[] | null;
  priority: number;
  isActive: boolean;
  rates: ShippingZoneRateReadModel[];
  restrictedProducts: ShippingZoneRestrictionReadModel[];
}

export interface ShippingZonePage {
  items: ShippingZoneReadModel[];
  total: number;
}

/** Un país cubierto, con los departamentos que se alcanzan dentro de él. */
export interface ShippingCoverageReadModel {
  countryCode: string;
  /** `null` = se cubre el país entero. */
  stateProvinces: string[] | null;
}

/**
 * [0049]: read model plano para el panel de configuración de zonas y para la
 * consulta pública de cobertura ([0042]) — no hidrata el agregado porque
 * ninguna de las dos lo muta (ver sección "Queries" del CLAUDE.md del repo).
 */
export interface ShippingZoneQueryRepository {
  listZones(pagination: { page: number; limit: number }): Promise<ShippingZonePage>;

  /** Países y departamentos con al menos una zona activa y una tarifa activa. */
  listCoverage(): Promise<ShippingCoverageReadModel[]>;
}
