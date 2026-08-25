import { Currency } from "../../../shared-kernel/domain/enums/Currency";
import { ShippingMethod } from "../enums/ShippingMethod";
import { ShippingDestination } from "../repositories/ShippingRateQueryRepository";

/** Bulto agregado del pedido: lo que la transportadora necesita para cotizar. */
export interface ParcelMeasurements {
  weightGrams: number;
  lengthCm: number | null;
  widthCm: number | null;
  heightCm: number | null;
}

export interface CarrierRateQuote {
  /** Método del vocabulario del negocio al que corresponde este servicio. */
  method: ShippingMethod;
  label: string;
  cost: number;
  currency: Currency;
  estimatedMinDays: number;
  estimatedMaxDays: number;
  carrierCode: string;
  carrierName: string;
  /** Código del servicio dentro de la transportadora, tal como ella lo nombra. */
  serviceCode: string | null;
}

export interface CarrierRateRequest {
  destination: ShippingDestination;
  parcel: ParcelMeasurements;
  /** Valor declarado del contenido, en `currency`. Varias transportadoras lo usan para el seguro. */
  declaredValue: number;
  currency: Currency;
}

/**
 * [0048]: consulta de tarifas en tiempo real a una transportadora externa.
 *
 * Es un puerto y no una clase concreta porque la transportadora a integrar
 * **sigue pendiente de definir** (ver "Pendiente de definir" en el CLAUDE.md
 * del repo): lo que queda fijo es la forma de la pregunta y de la respuesta, y
 * cambiar de proveedor debería tocar un solo archivo de infraestructura.
 *
 * El contrato no permite fallar de forma útil a propósito: quien lo consume
 * (`GetShippingOptions`) trata cualquier error o respuesta vacía como "usá la
 * tarifa de respaldo". Una caída de la transportadora no puede tumbar un
 * checkout.
 */
export interface CarrierRateProviderPort {
  /** Nombre legible para logs. */
  readonly carrierName: string;

  getRates(request: CarrierRateRequest): Promise<CarrierRateQuote[]>;
}
