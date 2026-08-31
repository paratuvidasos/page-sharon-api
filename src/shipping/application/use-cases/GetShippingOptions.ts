import { Currency } from "../../../shared-kernel/domain/enums/Currency";
import { ExchangeRateProvider } from "../../../shared-kernel/domain/ports/ExchangeRateProvider";
import { ShippingMethod } from "../../domain/enums/ShippingMethod";
import { NoShippingCoverageException } from "../../domain/exceptions/NoShippingCoverageException";
import { RestrictedProductDetail } from "../../domain/exceptions/ProductsRestrictedForZoneException";
import {
  CarrierRateProviderPort,
  CarrierRateQuote,
  ParcelMeasurements,
} from "../../domain/ports/CarrierRateProviderPort";
import {
  ShippingDestination,
  ShippingRateQueryRepository,
  ShippingRateReadModel,
} from "../../domain/repositories/ShippingRateQueryRepository";
import { buildParcel, ShipmentItem } from "../parcel";
import { ProductParcelPort } from "../ports/ProductParcelPort";

export interface GetShippingOptionsInput {
  countryCode: string;
  /**
   * [0042]: opcional. Desde el carrito o la ficha de producto el comprador
   * solo escribe país y código postal; el checkout siempre manda los tres.
   */
  stateProvince?: string | null;
  /** [0049]: permite resolver zonas definidas por código postal. */
  postalCode?: string | null;
  /** Subtotal del pedido (ya con descuento aplicado), en `currency`. */
  subtotal: number;
  currency: Currency;
  /**
   * Qué se está enviando. De acá salen dos cosas:
   *
   *  - el bulto que se le cotiza a la transportadora ([0048]), resuelto contra
   *    el catálogo — nunca contra lo que mande el cliente;
   *  - los productos restringidos para la zona ([0042]/[0049]), que acá se
   *    informan en vez de cortar: quien mira el carrito todavía puede quitar
   *    el producto o cambiar la dirección. El checkout sí corta, con
   *    `CheckShippingRestrictions`.
   *
   * Vacío desde la ficha de producto de alguien que aún no eligió variante:
   * ahí solo se puede mostrar la tarifa de respaldo.
   */
  items?: ShipmentItem[];
}

/** De dónde salió el precio de esta opción. */
export type ShippingRateSource = "CARRIER" | "FALLBACK";

export interface ShippingOption {
  method: ShippingMethod;
  label: string;
  cost: number;
  currency: Currency;
  estimatedMinDays: number;
  estimatedMaxDays: number;
  /** true cuando el subtotal alcanzó el umbral y por eso el costo quedó en cero. */
  freeShippingApplied: boolean;
  source: ShippingRateSource;
  carrierCode: string | null;
  carrierName: string | null;
}

export interface GetShippingOptionsResult {
  zoneName: string;
  currency: Currency;
  options: ShippingOption[];
  restrictedProducts: RestrictedProductDetail[];
}

/** Forma común de una tarifa antes de convertirla y aplicarle el umbral. */
interface RawOption {
  method: ShippingMethod;
  label: string;
  cost: number;
  currency: Currency;
  estimatedMinDays: number;
  estimatedMaxDays: number;
  source: ShippingRateSource;
  carrierCode: string | null;
  carrierName: string | null;
}

/**
 * [0034] + [0048]: opciones de envío disponibles para una dirección, con su
 * costo y tiempo estimado.
 *
 * **La cobertura la decide la zona configurada, no la transportadora.** Si
 * ninguna zona activa cubre el destino se corta acá, aunque la transportadora
 * pudiera llegar: a qué países y regiones se vende es una decisión de negocio
 * ([0049]), no una consecuencia de la red de un proveedor.
 *
 * Sobre esa base se intenta cotizar con la transportadora, y si eso falla o no
 * devuelve nada se usan las tarifas de `shipping_rates` — la "tarifa de
 * respaldo configurada manualmente" del criterio de [0048]. El error nunca se
 * propaga: una caída de la transportadora no puede tumbar un checkout.
 *
 * Las tarifas se guardan en la moneda base y se convierten a la moneda del
 * pedido acá ([0041]), para que el usuario vea un solo tipo de moneda en todo
 * el checkout. El redondeo es hacia arriba: cobrar de menos por un redondeo
 * sale del margen del negocio.
 */
export class GetShippingOptions {
  constructor(
    private readonly shippingRateQueryRepository: ShippingRateQueryRepository,
    private readonly exchangeRateProvider: ExchangeRateProvider,
    private readonly carrierRateProvider: CarrierRateProviderPort,
    private readonly productParcelPort: ProductParcelPort,
  ) {}

  async execute(input: GetShippingOptionsInput): Promise<GetShippingOptionsResult> {
    const destination: ShippingDestination = {
      countryCode: input.countryCode,
      stateProvince: input.stateProvince ?? null,
      postalCode: input.postalCode ?? null,
    };

    const rates = await this.shippingRateQueryRepository.findRatesForDestination(destination);
    if (rates.length === 0) {
      throw new NoShippingCoverageException();
    }

    // Una sola consulta al catálogo por cotización: de ahí salen tanto las
    // medidas del bulto como los ids de producto para las restricciones.
    const items = input.items ?? [];
    const snapshots =
      items.length > 0
        ? await this.productParcelPort.execute({
            variantIds: Array.from(new Set(items.map((item) => item.variantId))),
          })
        : [];

    const carrierOptions = await this.quoteWithCarrier(input, destination, buildParcel(items, snapshots));
    const rawOptions = mergeOptions(rates.map(toFallbackOption), carrierOptions);

    // El umbral de envío gratis es una promesa del negocio ("gratis desde
    // $150.000"), no una característica de la transportadora: se sigue
    // aplicando aunque el precio venga de la API externa. Se busca por método
    // contra la tarifa configurada de la misma zona.
    const configuredByMethod = new Map(rates.map((rate) => [rate.method, rate]));

    const options: ShippingOption[] = [];
    for (const raw of rawOptions) {
      const rateToTarget = await this.exchangeRateProvider.getRate(raw.currency, input.currency);
      const cost = Math.ceil(raw.cost * rateToTarget);

      const configured = configuredByMethod.get(raw.method);
      const threshold = await this.convertThreshold(configured, input.currency);
      const freeShippingApplied = threshold != null && input.subtotal >= threshold;

      options.push({
        method: raw.method,
        label: raw.label,
        cost: freeShippingApplied ? 0 : cost,
        currency: input.currency,
        estimatedMinDays: raw.estimatedMinDays,
        estimatedMaxDays: raw.estimatedMaxDays,
        freeShippingApplied,
        source: raw.source,
        carrierCode: raw.carrierCode,
        carrierName: raw.carrierName,
      });
    }

    options.sort((a, b) => a.cost - b.cost);

    // La zona ya está resuelta por la consulta de tarifas, así que preguntar
    // por las restricciones no cuesta una segunda resolución de zona.
    const productIds = Array.from(new Set(snapshots.map((snapshot) => snapshot.productId)));
    const restrictedProducts =
      productIds.length > 0
        ? await this.shippingRateQueryRepository.findRestrictedProducts(rates[0].zoneId, productIds)
        : [];

    return { zoneName: rates[0].zoneName, currency: input.currency, options, restrictedProducts };
  }

  /**
   * `null` significa "no hay cotización de la transportadora, usá el
   * respaldo" — tanto si no se la consultó como si falló. La distinción no le
   * importa a quien llama; lo que sí importa es que quede en el log, porque
   * una transportadora caída durante horas se ve como envíos más caros o más
   * baratos de lo esperado y nadie relaciona una cosa con la otra.
   */
  private async quoteWithCarrier(
    input: GetShippingOptionsInput,
    destination: ShippingDestination,
    parcel: ParcelMeasurements | null,
  ): Promise<RawOption[] | null> {
    if (!parcel) {
      return null;
    }

    try {
      const quotes = await this.carrierRateProvider.getRates({
        destination,
        parcel,
        declaredValue: input.subtotal,
        currency: input.currency,
      });

      return quotes.length > 0 ? quotes.map(toCarrierOption) : null;
    } catch (error) {
      console.error(
        `[shipping] ${this.carrierRateProvider.carrierName} no pudo cotizar el envío; se usa la tarifa de respaldo:`,
        error,
      );
      return null;
    }
  }

  private async convertThreshold(
    configured: ShippingRateReadModel | undefined,
    currency: Currency,
  ): Promise<number | null> {
    if (!configured || configured.freeShippingThreshold == null) {
      return null;
    }
    const rate = await this.exchangeRateProvider.getRate(configured.currency, currency);
    return Math.ceil(configured.freeShippingThreshold * rate);
  }
}

function toFallbackOption(rate: ShippingRateReadModel): RawOption {
  return {
    method: rate.method,
    label: rate.label,
    cost: rate.cost,
    currency: rate.currency,
    estimatedMinDays: rate.estimatedMinDays,
    estimatedMaxDays: rate.estimatedMaxDays,
    source: "FALLBACK",
    carrierCode: null,
    carrierName: null,
  };
}

/**
 * La cotización de la transportadora pisa a la tarifa manual **método por
 * método**, no la lista entera.
 *
 * Si se reemplazara todo, "recoger en tienda" desaparecería en cuanto la
 * transportadora contestara: ninguna cotiza un servicio que consiste en que el
 * cliente venga al local. Y un método que la transportadora no cubre para ese
 * destino sigue teniendo su tarifa configurada a mano, que es justamente el
 * respaldo que pide [0048].
 */
function mergeOptions(fallback: RawOption[], carrier: RawOption[] | null): RawOption[] {
  if (!carrier) {
    return fallback;
  }

  const byMethod = new Map(fallback.map((option) => [option.method, option]));
  for (const option of carrier) {
    byMethod.set(option.method, option);
  }
  return Array.from(byMethod.values());
}

function toCarrierOption(quote: CarrierRateQuote): RawOption {
  return {
    method: quote.method,
    label: quote.label,
    cost: quote.cost,
    currency: quote.currency,
    estimatedMinDays: quote.estimatedMinDays,
    estimatedMaxDays: quote.estimatedMaxDays,
    source: "CARRIER",
    carrierCode: quote.carrierCode,
    carrierName: quote.carrierName,
  };
}
