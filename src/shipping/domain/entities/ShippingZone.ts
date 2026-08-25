import { Currency } from "../../../shared-kernel/domain/enums/Currency";
import { ShippingMethod } from "../enums/ShippingMethod";
import { InvalidShippingZoneException } from "../exceptions/InvalidShippingZoneException";

/**
 * Tarifa de un método dentro de la zona. No tiene id propio en el dominio: su
 * identidad dentro del agregado es el método (una zona no puede tener dos
 * tarifas del mismo método), y el id de la fila es un detalle de persistencia.
 * Nada lo referencia desde afuera — el pedido guarda un snapshot del método,
 * no una FK a la tarifa.
 */
export interface ZoneShippingRateProps {
  method: ShippingMethod;
  label: string;
  cost: number;
  currency: Currency;
  estimatedMinDays: number;
  estimatedMaxDays: number;
  /** Subtotal a partir del cual esta tarifa queda en cero. `null` = nunca es gratis. */
  freeShippingThreshold: number | null;
  isActive: boolean;
}

export interface ZoneProductRestrictionProps {
  productId: string;
  /** Motivo visible para el administrador (ej. "prohibido por aduana"). */
  reason: string | null;
}

export interface ShippingZoneProps {
  id: string;
  name: string;
  countryCode: string;
  /** `null` = la zona cubre el país entero, sin distinguir departamento. */
  stateProvinces: string[] | null;
  /** Patrones `LIKE` de código postal (ej. `"110%"`). `null` = cualquier código. */
  postalCodePatterns: string[] | null;
  priority: number;
  isActive: boolean;
  rates: ZoneShippingRateProps[];
  restrictedProducts: ZoneProductRestrictionProps[];
}

export interface CreateShippingZoneInput {
  id: string;
  name: string;
  countryCode: string;
  stateProvinces: string[] | null;
  postalCodePatterns: string[] | null;
  priority: number;
  isActive: boolean;
  rates: ZoneShippingRateProps[];
}

export interface UpdateShippingZoneCoverageInput {
  name?: string;
  stateProvinces?: string[] | null;
  postalCodePatterns?: string[] | null;
  priority?: number;
  isActive?: boolean;
}

/**
 * [0049]: agregado raíz de la cobertura de envíos. Una zona es un país, o un
 * subconjunto de sus departamentos, o un conjunto de códigos postales, con
 * sus tarifas y con los productos que no se pueden mandar ahí.
 *
 * Hasta ahora las zonas solo existían como filas sembradas por una migración
 * y no había dónde poner una invariante: nada impedía una tarifa con
 * `estimatedMinDays` mayor que el máximo, ni dos tarifas STANDARD en la misma
 * zona. Con el panel administrativo esos datos pasan a venir de afuera, así
 * que las reglas tienen que vivir en el dominio.
 *
 * Las tarifas y las restricciones son parte del agregado y se guardan en la
 * misma transacción que la zona (`ShippingZoneRepository.save`) — no tienen
 * repositorio propio, igual que `OrderItem` dentro de `Order`.
 */
export class ShippingZone {
  private constructor(private props: ShippingZoneProps) {}

  static create(input: CreateShippingZoneInput): ShippingZone {
    const zone = new ShippingZone({
      id: input.id,
      name: normalizeName(input.name),
      countryCode: normalizeCountryCode(input.countryCode),
      stateProvinces: normalizeList(input.stateProvinces),
      postalCodePatterns: normalizeList(input.postalCodePatterns),
      priority: normalizePriority(input.priority),
      isActive: input.isActive,
      rates: normalizeRates(input.rates),
      restrictedProducts: [],
    });
    return zone;
  }

  static reconstitute(props: ShippingZoneProps): ShippingZone {
    return new ShippingZone(props);
  }

  get id(): string {
    return this.props.id;
  }

  get name(): string {
    return this.props.name;
  }

  get countryCode(): string {
    return this.props.countryCode;
  }

  update(input: UpdateShippingZoneCoverageInput): void {
    if (input.name !== undefined) {
      this.props.name = normalizeName(input.name);
    }
    if (input.stateProvinces !== undefined) {
      this.props.stateProvinces = normalizeList(input.stateProvinces);
    }
    if (input.postalCodePatterns !== undefined) {
      this.props.postalCodePatterns = normalizeList(input.postalCodePatterns);
    }
    if (input.priority !== undefined) {
      this.props.priority = normalizePriority(input.priority);
    }
    if (input.isActive !== undefined) {
      this.props.isActive = input.isActive;
    }
  }

  /**
   * El panel manda siempre la lista completa de tarifas de la zona, no un
   * parche: es lo que el administrador ve en pantalla, y reemplazarla entera
   * evita tener que inventar un id estable de tarifa solo para poder editarla.
   */
  replaceRates(rates: ZoneShippingRateProps[]): void {
    this.props.rates = normalizeRates(rates);
  }

  /** Mismo criterio que `replaceRates`: el panel manda el set completo. */
  replaceRestrictions(restrictions: ZoneProductRestrictionProps[]): void {
    const seen = new Set<string>();
    const normalized: ZoneProductRestrictionProps[] = [];

    for (const restriction of restrictions) {
      const productId = restriction.productId.trim();
      if (!productId || seen.has(productId)) {
        continue;
      }
      seen.add(productId);
      normalized.push({
        productId,
        reason: restriction.reason?.trim() ? restriction.reason.trim() : null,
      });
    }

    this.props.restrictedProducts = normalized;
  }

  /** Cuáles de los productos indicados están restringidos en esta zona. */
  restrictedProductsAmong(productIds: string[]): ZoneProductRestrictionProps[] {
    const wanted = new Set(productIds);
    return this.props.restrictedProducts.filter((restriction) => wanted.has(restriction.productId));
  }

  toProps(): ShippingZoneProps {
    return {
      ...this.props,
      stateProvinces: this.props.stateProvinces ? [...this.props.stateProvinces] : null,
      postalCodePatterns: this.props.postalCodePatterns ? [...this.props.postalCodePatterns] : null,
      rates: this.props.rates.map((rate) => ({ ...rate })),
      restrictedProducts: this.props.restrictedProducts.map((restriction) => ({ ...restriction })),
    };
  }
}

function normalizeName(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) {
    throw new InvalidShippingZoneException("La zona necesita un nombre.");
  }
  return trimmed;
}

function normalizeCountryCode(countryCode: string): string {
  const normalized = countryCode.trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(normalized)) {
    throw new InvalidShippingZoneException(
      "El país de la zona debe ser un código ISO de dos letras (ej. CO).",
    );
  }
  return normalized;
}

function normalizePriority(priority: number): number {
  if (!Number.isInteger(priority) || priority < 0) {
    throw new InvalidShippingZoneException("La prioridad debe ser un entero mayor o igual a cero.");
  }
  return priority;
}

/**
 * Una lista vacía y `null` significan lo mismo —"sin restringir"— y dejar las
 * dos formas en la base obligaría a que cada consulta contemplara ambas. Se
 * normaliza a `null`, que es lo que la query interpreta como "cubre todo".
 */
function normalizeList(values: string[] | null): string[] | null {
  if (!values) {
    return null;
  }
  const cleaned = Array.from(
    new Set(values.map((value) => value.trim().toUpperCase()).filter(Boolean)),
  );
  return cleaned.length > 0 ? cleaned : null;
}

function normalizeRates(rates: ZoneShippingRateProps[]): ZoneShippingRateProps[] {
  const byMethod = new Map<ShippingMethod, ZoneShippingRateProps>();

  for (const rate of rates) {
    if (byMethod.has(rate.method)) {
      throw new InvalidShippingZoneException(
        `La zona tiene dos tarifas para el método ${rate.method}.`,
      );
    }
    const label = rate.label.trim();
    if (!label) {
      throw new InvalidShippingZoneException("Cada tarifa necesita una etiqueta visible.");
    }
    if (rate.cost < 0) {
      throw new InvalidShippingZoneException("El costo de una tarifa no puede ser negativo.");
    }
    if (!Number.isInteger(rate.estimatedMinDays) || rate.estimatedMinDays < 0) {
      throw new InvalidShippingZoneException(
        "El tiempo mínimo estimado debe ser un entero mayor o igual a cero.",
      );
    }
    if (rate.estimatedMaxDays < rate.estimatedMinDays) {
      throw new InvalidShippingZoneException(
        "El tiempo máximo estimado no puede ser menor que el mínimo.",
      );
    }
    if (rate.freeShippingThreshold != null && rate.freeShippingThreshold < 0) {
      throw new InvalidShippingZoneException("El umbral de envío gratis no puede ser negativo.");
    }

    byMethod.set(rate.method, { ...rate, label });
  }

  return Array.from(byMethod.values());
}
