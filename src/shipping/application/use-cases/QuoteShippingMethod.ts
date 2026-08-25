import { Currency } from "../../../shared-kernel/domain/enums/Currency";
import { ShippingMethod } from "../../domain/enums/ShippingMethod";
import { ShippingMethodNotAvailableException } from "../../domain/exceptions/ShippingMethodNotAvailableException";
import { GetShippingOptions, ShippingOption } from "./GetShippingOptions";

export interface QuoteShippingMethodInput {
  countryCode: string;
  stateProvince: string;
  subtotal: number;
  currency: Currency;
  method: ShippingMethod;
}

/**
 * [0034] + [0038]: recotiza en el servidor el método de envío que el cliente
 * dice haber elegido, y devuelve su costo real.
 *
 * Existe separado de `GetShippingOptions` porque el checkout no necesita la
 * lista completa: necesita el costo de UNA opción, y necesita que el costo
 * salga de la tabla de tarifas y no del body de la petición. Es lo que impide
 * que alguien confirme un pedido con `shippingCost: 0`.
 */
export class QuoteShippingMethod {
  constructor(private readonly getShippingOptions: GetShippingOptions) {}

  async execute(input: QuoteShippingMethodInput): Promise<ShippingOption> {
    const { options } = await this.getShippingOptions.execute({
      countryCode: input.countryCode,
      stateProvince: input.stateProvince,
      subtotal: input.subtotal,
      currency: input.currency,
    });

    const option = options.find((current) => current.method === input.method);
    if (!option) {
      throw new ShippingMethodNotAvailableException();
    }

    return option;
  }
}
