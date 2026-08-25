import { Currency } from "../../../shared-kernel/domain/enums/Currency";
import {
  listAvailablePaymentMethods,
  PaymentMethodDescriptor,
} from "../../domain/payment-method-catalog";

export interface ListPaymentMethodsInput {
  countryCode: string;
  currency: Currency;
}

export interface ListPaymentMethodsResult {
  countryCode: string;
  currency: Currency;
  methods: PaymentMethodDescriptor[];
}

/**
 * [0035]: métodos de pago habilitados para el país y la moneda de la compra.
 */
export class ListPaymentMethods {
  async execute(input: ListPaymentMethodsInput): Promise<ListPaymentMethodsResult> {
    return {
      countryCode: input.countryCode.toUpperCase(),
      currency: input.currency,
      methods: listAvailablePaymentMethods(input.countryCode, input.currency),
    };
  }
}
