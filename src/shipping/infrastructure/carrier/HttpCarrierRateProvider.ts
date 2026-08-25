import { Currency } from "../../../shared-kernel/domain/enums/Currency";
import { ShippingMethod } from "../../domain/enums/ShippingMethod";
import {
  CarrierRateProviderPort,
  CarrierRateQuote,
  CarrierRateRequest,
} from "../../domain/ports/CarrierRateProviderPort";

export interface HttpCarrierConfig {
  apiUrl: string;
  apiKey: string;
  carrierCode: string;
  carrierName: string;
  timeoutMs: number;
}

/**
 * Respuesta esperada de la transportadora. **La transportadora concreta sigue
 * pendiente de definir** (ver "Pendiente de definir" en el CLAUDE.md del
 * repo), así que este es un contrato genérico: la forma que tienen en común
 * las APIs de cotización del mercado (una lista de servicios con precio y
 * rango de días).
 *
 * Cuando el equipo elija proveedor, lo único que hay que reescribir es este
 * bloque y `mapQuote` — ni el puerto ni `GetShippingOptions` se enteran.
 */
interface CarrierApiResponse {
  rates?: Array<{
    service_code?: string;
    service_name?: string;
    /** Método del negocio al que mapea el servicio ("STANDARD" | "EXPRESS" | "PICKUP"). */
    service_level?: string;
    amount?: number | string;
    currency?: string;
    min_days?: number;
    max_days?: number;
  }>;
}

/**
 * [0048]: cotización en tiempo real contra la API de la transportadora.
 *
 * Usa `AbortSignal.timeout` porque el checkout está esperando: una
 * transportadora lenta no puede dejar al comprador mirando un spinner. Al
 * vencer el plazo se aborta y quien llama cae a la tarifa de respaldo — un
 * envío cotizado de más es mejor que un checkout que no responde.
 *
 * No reintenta: un reintento multiplicaría la espera del comprador por el
 * mismo resultado incierto, y el respaldo ya está ahí. Es la misma decisión
 * que tomó `BoldPaymentGateway` al no reintentar la consulta de estado.
 */
export class HttpCarrierRateProvider implements CarrierRateProviderPort {
  constructor(private readonly config: HttpCarrierConfig) {}

  get carrierName(): string {
    return this.config.carrierName;
  }

  async getRates(request: CarrierRateRequest): Promise<CarrierRateQuote[]> {
    const response = await fetch(this.config.apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify({
        destination: {
          country: request.destination.countryCode,
          state: request.destination.stateProvince ?? null,
          postal_code: request.destination.postalCode ?? null,
        },
        parcel: {
          weight_grams: request.parcel.weightGrams,
          length_cm: request.parcel.lengthCm,
          width_cm: request.parcel.widthCm,
          height_cm: request.parcel.heightCm,
        },
        declared_value: request.declaredValue,
        currency: request.currency,
      }),
      signal: AbortSignal.timeout(this.config.timeoutMs),
    });

    if (!response.ok) {
      throw new Error(
        `${this.config.carrierName} respondió ${response.status} al cotizar el envío.`,
      );
    }

    const payload = (await response.json()) as CarrierApiResponse;

    return (payload.rates ?? [])
      .map((rate) => this.mapQuote(rate, request.currency))
      .filter((quote): quote is CarrierRateQuote => quote !== null);
  }

  /**
   * Un servicio que no se puede mapear a un método del negocio se descarta en
   * vez de inventarle uno: el comprador elige entre "estándar" y "exprés", y
   * meterle el nombre comercial de un servicio de la transportadora en esa
   * lista rompería la promesa de [0045].
   */
  private mapQuote(
    rate: NonNullable<CarrierApiResponse["rates"]>[number],
    fallbackCurrency: Currency,
  ): CarrierRateQuote | null {
    const level = (rate.service_level ?? "").toUpperCase();
    if (!isShippingMethod(level)) {
      return null;
    }

    const cost = Number(rate.amount);
    if (!Number.isFinite(cost) || cost < 0) {
      return null;
    }

    const currency = isCurrency(rate.currency) ? rate.currency : fallbackCurrency;
    const minDays = Number.isInteger(rate.min_days) ? (rate.min_days as number) : 1;
    const maxDays = Number.isInteger(rate.max_days) ? (rate.max_days as number) : minDays;

    return {
      method: level,
      label: rate.service_name?.trim() || defaultLabelFor(level),
      cost,
      currency,
      estimatedMinDays: minDays,
      estimatedMaxDays: Math.max(minDays, maxDays),
      carrierCode: this.config.carrierCode,
      carrierName: this.config.carrierName,
      serviceCode: rate.service_code?.trim() || null,
    };
  }
}

function isShippingMethod(value: string): value is ShippingMethod {
  return Object.values(ShippingMethod).includes(value as ShippingMethod);
}

function isCurrency(value: string | undefined): value is Currency {
  return value != null && Object.values(Currency).includes(value as Currency);
}

function defaultLabelFor(method: ShippingMethod): string {
  switch (method) {
    case ShippingMethod.EXPRESS:
      return "Envío exprés";
    case ShippingMethod.PICKUP:
      return "Recoger en tienda";
    default:
      return "Envío estándar";
  }
}
