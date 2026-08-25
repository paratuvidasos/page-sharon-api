import { Currency } from "../../../shared-kernel/domain/enums/Currency";

export interface QuotedShipping {
  method: string;
  label: string;
  cost: number;
  currency: Currency;
  estimatedMinDays: number;
  estimatedMaxDays: number;
  freeShippingApplied: boolean;
  /** [0048]: de dónde salió el precio — "CARRIER" o "FALLBACK". */
  source: string;
  carrierCode: string | null;
  carrierName: string | null;
}

/** [0048]: qué se está enviando. `shipping` resuelve las medidas contra el catálogo. */
export interface QuotedShipmentItem {
  variantId: string;
  quantity: number;
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
    /** [0049]: hay zonas definidas por código postal, no solo por departamento. */
    postalCode: string | null;
    subtotal: number;
    currency: Currency;
    method: string;
    items: QuotedShipmentItem[];
  }): Promise<QuotedShipping>;
}
