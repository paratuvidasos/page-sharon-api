import { Currency } from "../../shared-kernel/domain/enums/Currency";
import { PaymentMethod } from "../../shared-kernel/domain/enums/PaymentMethod";

export interface PaymentMethodDescriptor {
  method: PaymentMethod;
  label: string;
  description: string;
}

const DESCRIPTORS: Record<string, PaymentMethodDescriptor> = {
  [PaymentMethod.CREDIT_CARD]: {
    method: PaymentMethod.CREDIT_CARD,
    label: "Tarjeta de crédito",
    description: "Visa, Mastercard, American Express y Diners.",
  },
  [PaymentMethod.DEBIT_CARD]: {
    method: PaymentMethod.DEBIT_CARD,
    label: "Tarjeta débito",
    description: "Tarjetas débito con habilitación para compras en línea.",
  },
  [PaymentMethod.PSE]: {
    method: PaymentMethod.PSE,
    label: "PSE",
    description: "Débito desde tu cuenta bancaria.",
  },
  [PaymentMethod.NEQUI]: {
    method: PaymentMethod.NEQUI,
    label: "Nequi",
    description: "Paga desde tu app de Nequi.",
  },
  [PaymentMethod.BANCOLOMBIA_BUTTON]: {
    method: PaymentMethod.BANCOLOMBIA_BUTTON,
    label: "Botón Bancolombia",
    description: "Paga desde tu cuenta o Ahorro a la Mano.",
  },
};

/**
 * [0035]: qué métodos se le ofrecen al comprador según país y moneda.
 *
 * Esto no vive en base de datos a propósito. Quién está realmente habilitado
 * lo decide el panel de comercios de Bold; esta lista solo controla qué se
 * pinta en el checkout, y tenerla en código la mantiene junto a la
 * integración que la sostiene.
 *
 * Los métodos locales colombianos (PSE, Nequi, Bancolombia) solo aplican a
 * compras en COP: no tiene sentido ofrecer un débito bancario local para
 * cobrar en dólares.
 */
const METHODS_BY_COUNTRY_AND_CURRENCY: Record<string, PaymentMethod[]> = {
  "CO:COP": [
    PaymentMethod.CREDIT_CARD,
    PaymentMethod.DEBIT_CARD,
    PaymentMethod.PSE,
    PaymentMethod.NEQUI,
    PaymentMethod.BANCOLOMBIA_BUTTON,
  ],
  "CO:USD": [PaymentMethod.CREDIT_CARD],
};

/** Fuera de Colombia Bold solo procesa tarjeta. */
const FALLBACK_METHODS: PaymentMethod[] = [PaymentMethod.CREDIT_CARD];

export function listAvailablePaymentMethods(
  countryCode: string,
  currency: Currency,
): PaymentMethodDescriptor[] {
  const methods =
    METHODS_BY_COUNTRY_AND_CURRENCY[`${countryCode.toUpperCase()}:${currency}`] ?? FALLBACK_METHODS;

  return methods.map((method) => DESCRIPTORS[method]);
}

export function isPaymentMethodAvailable(
  method: PaymentMethod,
  countryCode: string,
  currency: Currency,
): boolean {
  return listAvailablePaymentMethods(countryCode, currency).some(
    (descriptor) => descriptor.method === method,
  );
}
