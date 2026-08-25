import { Currency } from "../../../shared-kernel/domain/enums/Currency";
import { ExchangeRateProvider } from "../../../shared-kernel/domain/ports/ExchangeRateProvider";
import { ShippingMethod } from "../../domain/enums/ShippingMethod";
import { NoShippingCoverageException } from "../../domain/exceptions/NoShippingCoverageException";
import { ShippingRateQueryRepository } from "../../domain/repositories/ShippingRateQueryRepository";

export interface GetShippingOptionsInput {
  countryCode: string;
  stateProvince: string;
  /** Subtotal del pedido (ya con descuento aplicado), en `currency`. */
  subtotal: number;
  currency: Currency;
}

export interface ShippingOption {
  method: ShippingMethod;
  label: string;
  cost: number;
  currency: Currency;
  estimatedMinDays: number;
  estimatedMaxDays: number;
  /** true cuando el subtotal alcanzó el umbral y por eso el costo quedó en cero. */
  freeShippingApplied: boolean;
}

export interface GetShippingOptionsResult {
  zoneName: string;
  currency: Currency;
  options: ShippingOption[];
}

/**
 * [0034]: opciones de envío disponibles para una dirección, con su costo y
 * tiempo estimado.
 *
 * Las tarifas se guardan en la moneda base y se convierten a la moneda del
 * pedido aquí ([0041]), para que el usuario vea un solo tipo de moneda en
 * todo el checkout. El redondeo es hacia arriba: cobrar de menos por un
 * redondeo sale del margen del negocio.
 */
export class GetShippingOptions {
  constructor(
    private readonly shippingRateQueryRepository: ShippingRateQueryRepository,
    private readonly exchangeRateProvider: ExchangeRateProvider,
  ) {}

  async execute(input: GetShippingOptionsInput): Promise<GetShippingOptionsResult> {
    const rates = await this.shippingRateQueryRepository.findRatesForDestination({
      countryCode: input.countryCode,
      stateProvince: input.stateProvince,
    });

    if (rates.length === 0) {
      throw new NoShippingCoverageException();
    }

    const options: ShippingOption[] = [];
    for (const rate of rates) {
      const rateToTarget = await this.exchangeRateProvider.getRate(rate.currency, input.currency);
      const cost = Math.ceil(rate.cost * rateToTarget);

      const threshold =
        rate.freeShippingThreshold == null
          ? null
          : Math.ceil(rate.freeShippingThreshold * rateToTarget);
      const freeShippingApplied = threshold != null && input.subtotal >= threshold;

      options.push({
        method: rate.method,
        label: rate.label,
        cost: freeShippingApplied ? 0 : cost,
        currency: input.currency,
        estimatedMinDays: rate.estimatedMinDays,
        estimatedMaxDays: rate.estimatedMaxDays,
        freeShippingApplied,
      });
    }

    return { zoneName: rates[0].zoneName, currency: input.currency, options };
  }
}
