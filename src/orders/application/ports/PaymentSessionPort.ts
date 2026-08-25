import { Currency } from "../../../shared-kernel/domain/enums/Currency";
import { PaymentMethod } from "../../../shared-kernel/domain/enums/PaymentMethod";

export interface PaymentSessionCustomer {
  email: string;
  fullName: string;
  phone: string | null;
  documentNumber: string | null;
}

export interface PaymentSessionBillingAddress {
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

/**
 * Parámetros ya firmados que el navegador le pasa tal cual a la pasarela.
 * `orders` no los interpreta, solo los reenvía — de ahí que el tipo sea
 * deliberadamente genérico y no mencione ningún campo propio de Bold.
 */
export interface GatewaySessionParams {
  provider: string;
  scriptUrl: string;
  apiKey: string;
  referenceId: string;
  amount: number;
  currency: Currency;
  integritySignature: string;
  description: string;
  redirectionUrl: string;
  expirationDate: string;
  customerData: string;
  billingAddress: string;
  renderMode: string;
  sandbox: boolean;
}

export interface PaymentSession {
  attemptId: string;
  referenceId: string;
  expiresAt: Date;
  session: GatewaySessionParams;
}

/**
 * [0036]: `orders` le pide a `payments` que arranque el cobro y devuelva los
 * parámetros firmados para el navegador. `orders` no sabe que la pasarela es
 * Bold, ni ve una sola llave. Lo implementa `StartPaymentAttempt`.
 */
export interface PaymentSessionPort {
  execute(input: {
    orderId: string;
    orderNumber: string;
    amount: number;
    currency: Currency;
    paymentMethod: PaymentMethod;
    description: string;
    customer: PaymentSessionCustomer;
    billingAddress: PaymentSessionBillingAddress;
  }): Promise<PaymentSession>;
}
