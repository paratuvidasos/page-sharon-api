import { Currency } from "../../../shared-kernel/domain/enums/Currency";

export interface QuotedShipping {
  method: string;
  label: string;
  cost: number;
  currency: Currency;
  estimatedMinDays: number;
  estimatedMaxDays: number;
  freeShippingApplied: boolean;
}

/**
 * [0034] + [0038]: `orders` recotiza el envío en el servidor en vez de
 * confiar en el costo que mande el cliente. Lo implementa `shipping` con
 * `QuoteShippingMethod`.
 */
export interface ShippingQuotePort {
  execute(input: {
    countryCode: string;
    stateProvince: string;
    subtotal: number;
    currency: Currency;
    method: string;
  }): Promise<QuotedShipping>;
}
